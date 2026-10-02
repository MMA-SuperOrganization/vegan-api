export const createRecommendationService = ({
  recipeRepository,
  postRepository,
  videoRepository,
}) => {
  return {
    async getDiscoverFeed(userId) {
      // Mock implementation: just fetch latest published content
      const [recipes, posts, videos] = await Promise.all([
        recipeRepository.findMany({ status: "published" }, { limit: 5 }),
        postRepository.findMany({ status: "published" }, { limit: 5 }),
        videoRepository.findMany({ status: "published" }, { limit: 5 }),
      ]);

      return {
        featuredRecipes: recipes.data,
        featuredPosts: posts.data,
        featuredVideos: videos.data,
      };
    },

    async getRecipeRecommendations(userId) {
      // Logic could include checking user profile dietType, preferences
      const res = await recipeRepository.findMany({ status: "published" }, { limit: 10 });
      return res.data;
    },

    async getContentRecommendations(userId) {
      const [posts, videos] = await Promise.all([
        postRepository.findMany({ status: "published" }, { limit: 5 }),
        videoRepository.findMany({ status: "published" }, { limit: 5 }),
      ]);
      return [...posts.data, ...videos.data];
    },
  };
};
