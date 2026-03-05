const BookingModel = require("../models/booking");
const PostRequestModel = require("../models/postRequest");
const JobDeliveryModel = require("../models/jobDelivery");
const UserModel = require("../models/user");
const RatingModel = require("../models/rating");
const log4js = require("log4js");
const logger = log4js.getLogger();

class PortfolioService {
    
    async getProviderPortfolio(providerId) {
        try {
            const provider = await UserModel.findById(providerId);
            if (!provider) {
                throw new Error('Provider not found');
            }

            // Get completed bookings/services
            const completedBookings = await BookingModel.find({
                providerId: providerId,
                status: 'completed'
            }).sort({ lastUpdate: -1 });

            // Get completed post requests
            const completedRequests = await PostRequestModel.find({
                providerId: providerId,
                status: 'completed'
            }).sort({ lastUpdate: -1 });

            // Get job deliveries for additional project details
            const jobIds = [...completedBookings.map(b => b.jobId), ...completedRequests.map(r => r._id.toString())];
            const deliveries = await JobDeliveryModel.find({
                jobId: { $in: jobIds }
            });

            // Get ratings for completed work
            const ratings = await RatingModel.find({
                proId: providerId,
                status: 'active'
            }).populate('userId', 'firstName lastName photo')
              .sort({ createdAt: -1 });

            // Process portfolio items
            const portfolioItems = await this.processPortfolioItems(
                completedBookings, 
                completedRequests, 
                deliveries, 
                ratings
            );

            // Calculate portfolio statistics
            const stats = this.calculatePortfolioStats(portfolioItems, ratings);

            return {
                provider: {
                    id: provider._id,
                    name: `${provider.firstName} ${provider.lastName}`,
                    photo: provider.photo,
                    role: provider.role,
                    description: provider.description,
                    skills: provider.skills || [],
                    joinDate: provider.createdAt
                },
                portfolioItems,
                stats,
                totalItems: portfolioItems.length
            };

        } catch (error) {
            logger.error(`PORTFOLIO:: Error getting provider portfolio: ${error.message}`);
            throw error;
        }
    }

    async processPortfolioItems(bookings, requests, deliveries, ratings) {
        const items = [];

        // Process completed bookings
        for (const booking of bookings) {
            const delivery = deliveries.find(d => d.jobId === booking.jobId);
            const rating = ratings.find(r => r.jobId === booking.jobId);
            const clientName = await UserModel.findOne({username: booking.username}).select('firstName lastName').exec();
            
            items.push({
                id: booking._id,
                type: 'booking',
                title: booking.bookingTitle,
                description: booking.bookingDescription,
                category: booking.category,
                budget: booking.budget,
                budgetType: booking.budgetType,
                currency: booking.currency,
                completedDate: booking.lastUpdate,
                createdDate: booking.createdAt,
                clientName: clientName.firstName + ' ' + clientName.lastName,
                files: booking.providerFiles || [],
                deliveryFiles: delivery ? [delivery.file] : [],
                rating: rating ? {
                    score: rating.rating,
                    comment: rating.userComment,
                    title: rating.ratingTitle,
                    client: rating.userId
                } : null,
                status: 'completed',
                deliveryComment: delivery?.comment || booking.providerComments
            });
        }

        // Process completed requests
        for (const request of requests) {
            const delivery = deliveries.find(d => d.jobId === request._id.toString());
            const rating = ratings.find(r => r.jobId === request._id.toString());
            
            items.push({
                id: request._id,
                type: 'request',
                title: request.requestTitle,
                description: request.requestDescription,
                category: request.requestCategory,
                categoryIcon: request.requestCategoryIcon,
                budget: request.budget,
                budgetType: request.budgetType,
                currency: request.currency,
                completedDate: request.lastUpdate,
                createdDate: request.createdAt,
                clientName: request.username,
                files: request.files || [],
                deliveryFiles: delivery ? [delivery.file] : [],
                rating: rating ? {
                    score: rating.rating,
                    comment: rating.userComment,
                    title: rating.ratingTitle,
                    client: rating.userId
                } : null,
                status: 'completed',
                deliveryComment: delivery?.comment
            });
        }

        // Sort by completion date (most recent first)
        items.sort((a, b) => new Date(b.completedDate) - new Date(a.completedDate));

        return items;
    }

    calculatePortfolioStats(portfolioItems, ratings) {
        const totalProjects = portfolioItems.length;
        const totalEarnings = portfolioItems.reduce((sum, item) => sum + (item.budget || 0), 0);
        
        const ratedProjects = portfolioItems.filter(item => item.rating);
        const averageRating = ratedProjects.length > 0 
            ? ratedProjects.reduce((sum, item) => sum + item.rating.score, 0) / ratedProjects.length 
            : 0;

        const categories = [...new Set(portfolioItems.map(item => item.category).filter(Boolean))];
        
        const categoryStats = categories.map(category => ({
            name: category,
            count: portfolioItems.filter(item => item.category === category).length,
            earnings: portfolioItems
                .filter(item => item.category === category)
                .reduce((sum, item) => sum + (item.budget || 0), 0)
        }));

        // Recent activity (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentProjects = portfolioItems.filter(
            item => new Date(item.completedDate) > thirtyDaysAgo
        ).length;

        return {
            totalProjects,
            totalEarnings: Math.round(totalEarnings * 100) / 100,
            averageRating: Math.round(averageRating * 10) / 10,
            totalRatings: ratings.length,
            ratedProjectsCount: ratedProjects.length,
            categories: categoryStats,
            recentProjects,
            completionRate: 100 // Assuming all retrieved are completed
        };
    }

    async getPortfolioByCategory(providerId, category) {
        try {
            const portfolio = await this.getProviderPortfolio(providerId);
            
            if (!category || category === 'all') {
                return portfolio;
            }

            const filteredItems = portfolio.portfolioItems.filter(
                item => item.category && item.category.toLowerCase() === category.toLowerCase()
            );

            return {
                ...portfolio,
                portfolioItems: filteredItems,
                totalItems: filteredItems.length
            };

        } catch (error) {
            logger.error(`PORTFOLIO:: Error getting portfolio by category: ${error.message}`);
            throw error;
        }
    }

    async getPortfolioItem(providerId, itemId) {
        try {
            const portfolio = await this.getProviderPortfolio(providerId);
            const item = portfolio.portfolioItems.find(item => item.id.toString() === itemId);
            
            if (!item) {
                throw new Error('Portfolio item not found');
            }

            return {
                provider: portfolio.provider,
                item
            };

        } catch (error) {
            logger.error(`PORTFOLIO:: Error getting portfolio item: ${error.message}`);
            throw error;
        }
    }
}

module.exports = PortfolioService;