const RatingModel = require("../models/rating");
const UserModel = require("../models/user");
const FacebookFriendsService = require("./facebookFriends");
const log4js = require("log4js");
const logger = log4js.getLogger();

class FriendReviewsService {
    constructor() {
        this.facebookFriendsService = new FacebookFriendsService();
    }

    async getFriendReviewsForProvider(userId, providerId) {
        try {
            const friends = await this.facebookFriendsService.getFacebookFriends(userId);
            const friendUserIds = friends.map(f => f.friendUserId);
            
            const friendReviews = await RatingModel.find({
                proId: providerId,
                userId: { $in: friendUserIds },
                status: 'active',
                $or: [
                    { isPublic: true },
                    { visibleToFriendsOnly: true }
                ]
            }).populate('userId', 'firstName lastName photo')
              .sort({ createdAt: -1 });
            
            const reviewsWithFriendInfo = await Promise.all(friendReviews.map(async (review) => {
                const friendInfo = friends.find(f => f.friendUserId === review.userId._id.toString());
                const areFriends = await this.facebookFriendsService.areFacebookFriends(userId, review.userId._id.toString());
                
                return {
                    ...review.toObject(),
                    isFacebookFriend: areFriends,
                    friendInfo: friendInfo,
                    reviewer: {
                        name: `${review.userId.firstName} ${review.userId.lastName}`,
                        photo: review.userId.photo,
                        isFriend: true
                    },
                    type: 'review'
                };
            }));
            
            return reviewsWithFriendInfo;
        } catch (error) {
            logger.error(`FRIEND_REVIEWS:: Error getting friend reviews for provider: ${error.message}`);
            throw error;
        }
    }

    async getFriendPostsForProvider(userId, accessToken) {
        try {
            if (!accessToken) {
                logger.warn('FRIEND_REVIEWS:: No Facebook access token provided');
                return [];
            }

            const friendsPosts = await this.facebookFriendsService.fetchFriendsPostsWithHashtag(
                userId, 
                accessToken, 
                '#mosalapro'
            );
            
            const postsWithMetadata = friendsPosts.map(post => ({
                ...post,
                type: 'post',
                content: post.message,
                engagement: {
                    likes: post.likes?.summary?.total_count || 0,
                    comments: post.comments?.summary?.total_count || 0
                },
                createdAt: post.created_time
            }));
            
            return postsWithMetadata;
        } catch (error) {
            logger.error(`FRIEND_REVIEWS:: Error getting friend posts: ${error.message}`);
            return []; // Return empty array instead of throwing to not break the main flow
        }
    }

    async getReviewsWithFriendContext(userId, providerId, accessToken = null) {
        try {
            const [friendReviews, friendPosts, allReviews] = await Promise.all([
                this.getFriendReviewsForProvider(userId, providerId),
                this.getFriendPostsForProvider(userId, accessToken),
                RatingModel.find({
                    proId: providerId,
                    status: 'active',
                    isPublic: true
                }).populate('userId', 'firstName lastName photo')
                  .sort({ createdAt: -1 })
                  .limit(20)
            ]);
            
            const friends = await this.facebookFriendsService.getFacebookFriends(userId);
            const friendUserIds = friends.map(f => f.friendUserId);
            
            const reviewsWithContext = allReviews.map(review => ({
                ...review.toObject(),
                isFacebookFriend: friendUserIds.includes(review.userId._id.toString()),
                reviewer: {
                    name: `${review.userId.firstName} ${review.userId.lastName}`,
                    photo: review.userId.photo,
                    isFriend: friendUserIds.includes(review.userId._id.toString())
                },
                type: 'review'
            }));
            
            // Combine reviews and posts, sort by date
            const combinedContent = [...friendReviews, ...friendPosts];
            combinedContent.sort((a, b) => new Date(b.createdAt || b.created_time) - new Date(a.createdAt || a.created_time));
            
            const friendCount = friendReviews.length;
            const averageFriendRating = friendReviews.length > 0 
                ? friendReviews.reduce((sum, r) => sum + r.rating, 0) / friendReviews.length 
                : 0;
            
            return {
                friendReviews: combinedContent, // Now includes both reviews and posts
                friendPosts: friendPosts,
                allReviews: reviewsWithContext,
                stats: {
                    friendReviewCount: friendCount,
                    friendPostCount: friendPosts.length,
                    averageFriendRating: Math.round(averageFriendRating * 10) / 10,
                    totalReviews: reviewsWithContext.length,
                    totalFriendContent: combinedContent.length
                }
            };
        } catch (error) {
            logger.error(`FRIEND_REVIEWS:: Error getting reviews with friend context: ${error.message}`);
            throw error;
        }
    }

    async markReviewHelpful(userId, reviewId) {
        try {
            const review = await RatingModel.findById(reviewId);
            if (!review) {
                throw new Error('Review not found');
            }
            
            await RatingModel.findByIdAndUpdate(reviewId, {
                $inc: { helpfulVotes: 1 },
                lastUpdate: new Date()
            });
            
            return { success: true, message: 'Review marked as helpful' };
        } catch (error) {
            logger.error(`FRIEND_REVIEWS:: Error marking review as helpful: ${error.message}`);
            throw error;
        }
    }

    async reportReview(userId, reviewId, reason) {
        try {
            const review = await RatingModel.findById(reviewId);
            if (!review) {
                throw new Error('Review not found');
            }
            
            await RatingModel.findByIdAndUpdate(reviewId, {
                $inc: { reportedCount: 1 },
                lastUpdate: new Date(),
                status: review.reportedCount >= 2 ? 'reported' : 'active'
            });
            
            return { success: true, message: 'Review reported successfully' };
        } catch (error) {
            logger.error(`FRIEND_REVIEWS:: Error reporting review: ${error.message}`);
            throw error;
        }
    }

    async getProviderReviewsSummary(userId, providerId, accessToken = null) {
        try {
            const provider = await UserModel.findById(providerId);
            if (!provider) {
                throw new Error('Provider not found');
            }
            
            const friends = await this.facebookFriendsService.getFacebookFriends(userId);
            const friendUserIds = friends.map(f => f.friendUserId);
            
            const [friendReviews, friendPosts, allReviews, mutualFriends] = await Promise.all([
                RatingModel.find({
                    proId: providerId,
                    userId: { $in: friendUserIds },
                    status: 'active'
                }),
                this.getFriendPostsForProvider(userId, accessToken),
                RatingModel.find({
                    proId: providerId,
                    status: 'active',
                    isPublic: true
                }),
                this.facebookFriendsService.getMutualFriends(userId, providerId)
            ]);
            
            return {
                provider: {
                    name: `${provider.firstName} ${provider.lastName}`,
                    rating: provider.rating,
                    ratingCount: provider.ratingCount,
                    photo: provider.photo
                },
                friendStats: {
                    reviewCount: friendReviews.length,
                    friendPostCount: friendPosts.length,
                    averageRating: friendReviews.length > 0 
                        ? Math.round((friendReviews.reduce((sum, r) => sum + r.rating, 0) / friendReviews.length) * 10) / 10
                        : 0
                },
                overallStats: {
                    reviewCount: allReviews.length,
                    averageRating: Math.round(provider.rating * 10) / 10
                },
                mutualFriends: mutualFriends.slice(0, 5),
                mutualFriendsCount: mutualFriends.length
            };
        } catch (error) {
            logger.error(`FRIEND_REVIEWS:: Error getting provider reviews summary: ${error.message}`);
            throw error;
        }
    }
}

module.exports = FriendReviewsService;