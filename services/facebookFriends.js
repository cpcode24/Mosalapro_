const FacebookFriendModel = require("../models/facebookFriend");
const UserModel = require("../models/user");
const axios = require("axios");
const log4js = require("log4js");
const logger = log4js.getLogger();

class FacebookFriendsService {

    async fetchFacebookFriends(userId, accessToken) {
        try {
            const response = await axios.get(`https://graph.facebook.com/v18.0/me/friends`, {
                params: {
                    access_token: accessToken,
                    fields: 'id,name,email,picture'
                }
            });
            
            const friends = response.data.data;
            const friendRecords = [];
            
            for (const friend of friends) {
                const friendUser = await UserModel.findOne({ facebook_id: friend.id });
                
                if (friendUser) {
                    const friendRecord = await FacebookFriendModel.findOneAndUpdate(
                        {
                            userId: userId,
                            friendUserId: friendUser._id.toString()
                        },
                        {
                            friendFacebookId: friend.id,
                            friendName: friend.name,
                            friendEmail: friend.email || friendUser.email,
                            friendPhoto: friend.picture?.data?.url || friendUser.photo,
                            lastUpdate: new Date(),
                            status: 'active'
                        },
                        {
                            upsert: true,
                            new: true
                        }
                    );
                    
                    friendRecords.push(friendRecord);
                }
            }
            
            logger.info(`FACEBOOK_FRIENDS:: Synced ${friendRecords.length} friends for user ${userId}`);
            return friendRecords;
            
        } catch (error) {
            logger.error(`FACEBOOK_FRIENDS:: Error fetching Facebook friends: ${error.message}`);
            throw error;
        }
    }

    async getFacebookFriends(userId) {
        try {
            const friends = await FacebookFriendModel.find({
                userId: userId,
                status: 'active'
            }).sort({ friendName: 1 });
            
            return friends;
        } catch (error) {
            logger.error(`FACEBOOK_FRIENDS:: Error getting Facebook friends: ${error.message}`);
            throw error;
        }
    }

    async getFriendsByIds(friendUserIds) {
        try {
            const friends = await FacebookFriendModel.find({
                friendUserId: { $in: friendUserIds },
                status: 'active'
            });
            
            return friends;
        } catch (error) {
            logger.error(`FACEBOOK_FRIENDS:: Error getting friends by IDs: ${error.message}`);
            throw error;
        }
    }

    async areFacebookFriends(userId, friendUserId) {
        try {
            const friendship = await FacebookFriendModel.findOne({
                userId: userId,
                friendUserId: friendUserId,
                status: 'active'
            });
            
            return !!friendship;
        } catch (error) {
            logger.error(`FACEBOOK_FRIENDS:: Error checking friendship: ${error.message}`);
            return false;
        }
    }

    async getMutualFriends(userId1, userId2) {
        try {
            const user1Friends = await this.getFacebookFriends(userId1);
            const user2Friends = await this.getFacebookFriends(userId2);
            
            const user1FriendIds = user1Friends.map(f => f.friendUserId);
            const user2FriendIds = user2Friends.map(f => f.friendUserId);
            
            const mutualFriendIds = user1FriendIds.filter(id => user2FriendIds.includes(id));
            
            const mutualFriends = await UserModel.find({
                _id: { $in: mutualFriendIds }
            }).select('firstName lastName photo');
            
            return mutualFriends;
        } catch (error) {
            logger.error(`FACEBOOK_FRIENDS:: Error getting mutual friends: ${error.message}`);
            throw error;
        }
    }

    async fetchFacebookPostsWithHashtag(accessToken, hashtag = '#mosalapro') {
        try {
            const response = await axios.get(`https://graph.facebook.com/v18.0/me/feed`, {
                params: {
                    access_token: accessToken,
                    fields: 'id,message,created_time,likes.summary(true),comments.summary(true)',
                    limit: 100
                }
            });
            
            const posts = response.data.data || [];
            
            // Filter posts that contain the hashtag
            const filteredPosts = posts.filter(post => 
                post.message && post.message.toLowerCase().includes(hashtag.toLowerCase())
            );
            
            logger.info(`FACEBOOK_FRIENDS:: Found ${filteredPosts.length} posts with hashtag ${hashtag}`);
            return filteredPosts;
            
        } catch (error) {
            logger.error(`FACEBOOK_FRIENDS:: Error fetching Facebook posts: ${error.message}`);
            throw error;
        }
    }

    async fetchFriendsPostsWithHashtag(userId, accessToken, hashtag = '#mosalapro') {
        try {
            const friends = await this.getFacebookFriends(userId);
            const friendsPosts = [];
            
            for (const friend of friends) {
                try {
                    const response = await axios.get(`https://graph.facebook.com/v18.0/${friend.friendFacebookId}/feed`, {
                        params: {
                            access_token: accessToken,
                            fields: 'id,message,created_time,likes.summary(true),comments.summary(true),from',
                            limit: 50
                        }
                    });
                    
                    const posts = response.data.data || [];
                    const filteredPosts = posts.filter(post => 
                        post.message && post.message.toLowerCase().includes(hashtag.toLowerCase())
                    );
                    
                    filteredPosts.forEach(post => {
                        friendsPosts.push({
                            ...post,
                            friendInfo: {
                                userId: friend.friendUserId,
                                name: friend.friendName,
                                photo: friend.friendPhoto,
                                facebookId: friend.friendFacebookId
                            }
                        });
                    });
                    
                } catch (friendError) {
                    // Log but continue with other friends
                    logger.warn(`FACEBOOK_FRIENDS:: Could not fetch posts for friend ${friend.friendName}: ${friendError.message}`);
                }
            }
            
            // Sort by creation date, newest first
            friendsPosts.sort((a, b) => new Date(b.created_time) - new Date(a.created_time));
            
            logger.info(`FACEBOOK_FRIENDS:: Found ${friendsPosts.length} friend posts with hashtag ${hashtag}`);
            return friendsPosts;
            
        } catch (error) {
            logger.error(`FACEBOOK_FRIENDS:: Error fetching friends posts: ${error.message}`);
            throw error;
        }
    }
}

module.exports = FacebookFriendsService;