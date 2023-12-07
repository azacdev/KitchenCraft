import { TimeParamSchema } from "@/app/(home)/schema";
import {
  MediaTable,
  ProfileTable,
  RecipeMediaTable,
  RecipesTable,
  UpvotesTable,
  db,
} from "@/db";
import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";

// constants
const gravity = 1.8;
const oneHourInSeconds = 3600;

// common select expressions
const hoursSincePosted = sql<number>`EXTRACT(EPOCH FROM NOW() - ${RecipesTable.createdAt}) / ${oneHourInSeconds}`;
const points = sql<number>`(COUNT(DISTINCT ${UpvotesTable.userId}) + COUNT(DISTINCT ${RecipeMediaTable.mediaId}))::int`;
const mediaCount = sql<number>`COUNT(DISTINCT ${RecipeMediaTable.mediaId})::int`;
const scoreExpression = sql<number>`(${points} - 1) / POW((EXTRACT(EPOCH FROM NOW() - ${RecipesTable.createdAt}) / ${oneHourInSeconds} + 2), ${gravity})`;

export const getHotRecipes = async (userId?: string) => {
  return await db
    .select({
      slug: RecipesTable.slug,
      name: RecipesTable.name,
      description: RecipesTable.description,
      tags: RecipesTable.tags,
      totalTime: RecipesTable.totalTime,
      points,
      hoursSincePosted,
      score: scoreExpression,
      mediaCount,
    })
    .from(RecipesTable)
    .leftJoin(UpvotesTable, eq(RecipesTable.slug, UpvotesTable.slug))
    .leftJoin(
      RecipeMediaTable,
      eq(RecipesTable.slug, RecipeMediaTable.recipeSlug)
    ) // LEFT JOIN to include recipes with no media
    .groupBy(RecipesTable.slug)
    .orderBy(desc(scoreExpression))
    .limit(30)
    .execute();
};

export const getRecipe = async (slug: string) => {
  return await db
    .select({
      slug: RecipesTable.slug,
      name: RecipesTable.name,
      description: RecipesTable.description,
      createdBy: RecipesTable.createdBy,
      yield: RecipesTable.yield,
      tags: RecipesTable.tags,
      ingredients: RecipesTable.ingredients,
      instructions: RecipesTable.instructions,
      totalTime: RecipesTable.totalTime,
      activeTime: RecipesTable.activeTime,
      cookTime: RecipesTable.cookTime,
      createdAt: RecipesTable.createdAt,
    })
    .from(RecipesTable)
    .where(eq(RecipesTable.slug, slug))
    .execute()
    .then((res) => res[0]);
};

export const getSortedMediaForRecipe = async (recipeSlug: string) => {
  return await db
    .select({
      id: MediaTable.id,
      url: MediaTable.url,
      width: MediaTable.width,
      height: MediaTable.height,
      mediaType: MediaTable.mediaType,
      blobDataURL: MediaTable.blurDataURL,
    })
    .from(RecipeMediaTable)
    .innerJoin(MediaTable, eq(MediaTable.id, RecipeMediaTable.mediaId))
    .where(eq(RecipeMediaTable.recipeSlug, recipeSlug))
    .orderBy(RecipeMediaTable.sortOrder)
    .limit(10) // Limit the number of media items
    .execute();
};

export const getMediaCountForRecipe = async (slug: string) => {
  const result = await db
    .select({ value: count() }) // Using count() to count the number of rows
    .from(RecipeMediaTable)
    .where(eq(RecipeMediaTable.recipeSlug, slug)) // Filtering by recipeSlug
    .execute();

  return result[0]?.value;
};

export const getFirstMediaForRecipe = async (recipeSlug: string) => {
  return await db
    .select({
      id: MediaTable.id,
      url: MediaTable.url,
      width: MediaTable.width,
      height: MediaTable.height,
      contentType: MediaTable.contentType,
      mediaType: MediaTable.mediaType,
    })
    .from(RecipeMediaTable)
    .innerJoin(MediaTable, eq(MediaTable.id, RecipeMediaTable.mediaId))
    .where(eq(RecipeMediaTable.recipeSlug, recipeSlug))
    .orderBy(RecipeMediaTable.sortOrder)
    .limit(1) // Limit to the first media item
    .execute()
    .then((res) => res[0]); // Return the first result
};

export const getRecentRecipesByUser = async (userId: string) => {
  return await db
    .select({
      slug: RecipesTable.slug,
      name: RecipesTable.name,
      description: RecipesTable.description,
      totalTime: RecipesTable.totalTime,
      createdBy: RecipesTable.createdBy,
      createdAt: RecipesTable.createdAt,
      points,
      mediaCount: sql<number>`COUNT(DISTINCT ${RecipeMediaTable.mediaId})`, // Counts the number of unique media items per recipe
    })
    .from(RecipesTable)
    .leftJoin(UpvotesTable, eq(RecipesTable.slug, UpvotesTable.slug))
    .leftJoin(
      RecipeMediaTable,
      eq(RecipesTable.slug, RecipeMediaTable.recipeSlug)
    ) // LEFT JOIN to include media count
    .where(eq(RecipesTable.createdBy, userId))
    .groupBy(RecipesTable.slug) // Group by Recipe slug to allow COUNT to work correctly
    .orderBy(desc(RecipesTable.createdAt))
    .limit(30)
    .execute();
};

export const getRecentRecipesByProfile = async (profileSlug: string) => {
  return await db
    .select({
      slug: RecipesTable.slug,
      name: RecipesTable.name,
      description: RecipesTable.description,
      totalTime: RecipesTable.totalTime,
      createdBy: RecipesTable.createdBy,
      createdAt: RecipesTable.createdAt,
      points,
      mediaCount: sql<number>`COUNT(DISTINCT ${RecipeMediaTable.mediaId})::int`,
    })
    .from(RecipesTable)
    .innerJoin(ProfileTable, eq(ProfileTable.userId, RecipesTable.createdBy))
    .leftJoin(UpvotesTable, eq(RecipesTable.slug, UpvotesTable.slug))
    .leftJoin(
      RecipeMediaTable,
      eq(RecipesTable.slug, RecipeMediaTable.recipeSlug)
    )
    .where(eq(ProfileTable.profileSlug, profileSlug))
    .groupBy(RecipesTable.slug)
    .orderBy(desc(RecipesTable.createdAt)) // Order by most recent
    .limit(30) // Limit the number of results
    .execute();
};

export const getProfileBySlug = async (profileSlug: string) => {
  return await db
    .select({
      profileSlug: ProfileTable.profileSlug,
      activated: ProfileTable.activated,
      mediaId: ProfileTable.mediaId,
      userId: ProfileTable.userId,
      createdAt: ProfileTable.createdAt,
    })
    .from(ProfileTable)
    .where(eq(ProfileTable.profileSlug, profileSlug)) // Filter by the given profile slug
    .execute()
    .then((res) => res[0]); // Return the first (and expectedly only) result
};

export const getRecipesByTag = async (tag: string) => {
  return await db
    .select({
      slug: RecipesTable.slug,
      name: RecipesTable.name,
      description: RecipesTable.description,
      tags: RecipesTable.tags,
      totalTime: RecipesTable.totalTime,
      createdBy: RecipesTable.createdBy,
      createdAt: RecipesTable.createdAt,
      points,
      mediaCount,
    })
    .from(RecipesTable)
    .leftJoin(UpvotesTable, eq(RecipesTable.slug, UpvotesTable.slug))
    .leftJoin(
      RecipeMediaTable,
      eq(RecipesTable.slug, RecipeMediaTable.recipeSlug)
    )
    .where(
      sql`LOWER(${tag}) = ANY (SELECT LOWER(jsonb_array_elements_text(${RecipesTable.tags})))`
    )
    .groupBy(RecipesTable.slug)
    .orderBy(desc(RecipesTable.createdAt)) // Or any other order you prefer
    .limit(30)
    .execute();
};

export const getRecentRecipes = async () => {
  return await db
    .select({
      slug: RecipesTable.slug,
      name: RecipesTable.name,
      description: RecipesTable.description,
      totalTime: RecipesTable.totalTime,
      createdBy: RecipesTable.createdBy,
      createdAt: RecipesTable.createdAt,
      points,
      mediaCount,
    })
    .from(RecipesTable)
    .leftJoin(UpvotesTable, eq(RecipesTable.slug, UpvotesTable.slug))
    .leftJoin(
      RecipeMediaTable,
      eq(RecipesTable.slug, RecipeMediaTable.recipeSlug)
    )
    .groupBy(RecipesTable.slug)
    .orderBy(desc(RecipesTable.createdAt))
    .limit(30) // Adjust the limit as needed
    .execute();
};

export const getBestRecipes = async (
  timeFrame: z.infer<typeof TimeParamSchema>,
  userId?: string
) => {
  const timeCondition = getTimeCondition(timeFrame);

  return await db
    .select({
      slug: RecipesTable.slug,
      name: RecipesTable.name,
      description: RecipesTable.description,
      tags: RecipesTable.tags,
      totalTime: RecipesTable.totalTime,
      createdBy: RecipesTable.createdBy,
      createdAt: RecipesTable.createdAt,
      points,
      mediaCount,
    })
    .from(RecipesTable)
    .leftJoin(UpvotesTable, eq(RecipesTable.slug, UpvotesTable.slug))
    .leftJoin(
      RecipeMediaTable,
      eq(RecipesTable.slug, RecipeMediaTable.recipeSlug)
    )
    .where(timeCondition)
    .groupBy(RecipesTable.slug)
    .orderBy(desc(sql<number>`COUNT(${UpvotesTable.userId})`)) // You may also consider ordering by 'points' if that aligns better with your definition of 'best'
    .limit(30)
    .execute();
};

const getTimeCondition = (timeFrame: string) => {
  const oneHourInSeconds = 3600; // Seconds in an hour
  switch (timeFrame) {
    case "today":
      return sql`EXTRACT(EPOCH FROM NOW() - ${RecipesTable.createdAt}) / ${oneHourInSeconds} < 24`;
    case "week":
      return sql`EXTRACT(EPOCH FROM NOW() - ${RecipesTable.createdAt}) / ${oneHourInSeconds} < 168`; // 168 hours in a week
    case "month":
      return sql`EXTRACT(EPOCH FROM NOW() - ${RecipesTable.createdAt}) / ${oneHourInSeconds} < 720`; // Approx 720 hours in a month
    case "year":
      return sql`EXTRACT(EPOCH FROM NOW() - ${RecipesTable.createdAt}) / ${oneHourInSeconds} < 8760`; // Approx 8760 hours in a year
    case "all":
      return sql`TRUE`; // No time condition, select all
    default:
      throw new Error("Invalid time frame");
  }
};

interface MediaItem {
  id: string;
  url: string;
  width: number;
  height: number;
  mediaType: string;
  blobDataURL: string;
  recipeSlug: string; // Include the recipe slug to identify the media's recipe
}

export const getSortedMediaForMultipleRecipes = async (
  recipeSlugs: string[]
): Promise<{ [slug: string]: MediaItem[] }> => {
  const mediaItems = (await db
    .select({
      id: MediaTable.id,
      url: MediaTable.url,
      width: MediaTable.width,
      height: MediaTable.height,
      mediaType: MediaTable.mediaType,
      blobDataURL: MediaTable.blurDataURL,
      recipeSlug: RecipeMediaTable.recipeSlug,
    })
    .from(RecipeMediaTable)
    .innerJoin(MediaTable, eq(MediaTable.id, RecipeMediaTable.mediaId))
    .where(inArray(RecipeMediaTable.recipeSlug, recipeSlugs))
    .orderBy(RecipeMediaTable.sortOrder)
    .execute()) as MediaItem[];

  // Group media items by their recipe slug
  let mediaBySlug: { [slug: string]: MediaItem[] } = {};
  mediaItems.forEach((media) => {
    if (!mediaBySlug[media.recipeSlug]) {
      mediaBySlug[media.recipeSlug] = [];
    }
    mediaBySlug[media.recipeSlug]?.push(media);
  });

  // Optional: Arrange the results in the order of the provided slugs
  let orderedResults: { [slug: string]: MediaItem[] } = {};
  recipeSlugs.forEach((slug) => {
    orderedResults[slug] = mediaBySlug[slug] || [];
  });

  return orderedResults;
};

export const getUpvoteStatusForMultipleRecipes = async (
  recipeSlugs: string[],
  userId: string
): Promise<{ [slug: string]: boolean }> => {
  const upvoteItems = (await db
    .select({
      slug: UpvotesTable.slug,
      userId: UpvotesTable.userId,
    })
    .from(UpvotesTable)
    .where(
      and(
        inArray(UpvotesTable.slug, recipeSlugs),
        eq(UpvotesTable.userId, userId)
      )
    )
    .execute()) as { slug: string; userId: string }[];

  // Initialize a dictionary to hold the upvote status for each recipe
  let upvoteStatusBySlug: { [slug: string]: boolean } = {};

  // Set default values for each recipe slug as false (no upvote)
  recipeSlugs.forEach((slug) => {
    upvoteStatusBySlug[slug] = false;
  });

  // Update the dictionary based on the upvote data
  upvoteItems.forEach((item) => {
    if (item.userId === userId) {
      upvoteStatusBySlug[item.slug] = true;
    }
  });

  return upvoteStatusBySlug;
};

export const getProfileByUserId = async (userId: string) => {
  return await db
    .select({
      profileSlug: ProfileTable.profileSlug,
      activated: ProfileTable.activated,
      mediaId: ProfileTable.mediaId,
      userId: ProfileTable.userId,
      createdAt: ProfileTable.createdAt,
    })
    .from(ProfileTable)
    .where(eq(ProfileTable.userId, userId)) // Filter by the given userId
    .execute()
    .then((res) => res[0]); // Return the first (and expectedly only) result
};

export const getUserPointsLast30Days = async (userId: string) => {
  const thirtyDaysInSeconds = 30 * 24 * 3600; // Seconds in 30 days
  return await db
    .select({
      userId: RecipesTable.createdBy,
      points: sql<number>`(COUNT(DISTINCT ${UpvotesTable.userId}) + COUNT(DISTINCT ${RecipeMediaTable.mediaId}))::int`,
    })
    .from(RecipesTable)
    .leftJoin(UpvotesTable, eq(RecipesTable.slug, UpvotesTable.slug))
    .leftJoin(
      RecipeMediaTable,
      eq(RecipesTable.slug, RecipeMediaTable.recipeSlug)
    )
    .where(
      and(
        eq(RecipesTable.createdBy, userId),
        sql`EXTRACT(EPOCH FROM NOW() - ${RecipesTable.createdAt}) <= ${thirtyDaysInSeconds}`
      )
    )
    .groupBy(RecipesTable.createdBy)
    .execute()
    .then((res) => res[0]?.points || 0);
};

export const getUserLifetimePoints = async (userId: string) => {
  return await db
    .select({
      userId: RecipesTable.createdBy,
      points: sql<number>`(COUNT(DISTINCT ${UpvotesTable.userId}) + COUNT(DISTINCT ${RecipeMediaTable.mediaId}))::int`,
    })
    .from(RecipesTable)
    .leftJoin(UpvotesTable, eq(RecipesTable.slug, UpvotesTable.slug))
    .leftJoin(
      RecipeMediaTable,
      eq(RecipesTable.slug, RecipeMediaTable.recipeSlug)
    )
    .where(eq(RecipesTable.createdBy, userId))
    .groupBy(RecipesTable.createdBy)
    .execute()
    .then((res) => res[0]?.points || 0);
};

export const getProfileLifetimePoints = async (profileSlug: string) => {
  return await db
    .select({
      profileSlug: ProfileTable.profileSlug,
      points: sql<number>`(COUNT(DISTINCT ${UpvotesTable.userId}) + COUNT(DISTINCT ${RecipeMediaTable.mediaId}))::int`,
    })
    .from(RecipesTable)
    .leftJoin(UpvotesTable, eq(RecipesTable.slug, UpvotesTable.slug))
    .leftJoin(
      RecipeMediaTable,
      eq(RecipesTable.slug, RecipeMediaTable.recipeSlug)
    )
    .innerJoin(ProfileTable, eq(ProfileTable.userId, RecipesTable.createdBy))
    .where(eq(ProfileTable.profileSlug, profileSlug))
    .groupBy(ProfileTable.profileSlug)
    .execute()
    .then((res) => res[0]?.points || 0);
};

export const getProfilePointsLast30Days = async (profileSlug: string) => {
  const thirtyDaysInSeconds = 30 * 24 * 3600; // Seconds in 30 days
  return await db
    .select({
      profileSlug: ProfileTable.profileSlug,
      points: sql<number>`(COUNT(DISTINCT ${UpvotesTable.userId}) + COUNT(DISTINCT ${RecipeMediaTable.mediaId}))::int`,
    })
    .from(RecipesTable)
    .leftJoin(UpvotesTable, eq(RecipesTable.slug, UpvotesTable.slug))
    .leftJoin(
      RecipeMediaTable,
      eq(RecipesTable.slug, RecipeMediaTable.recipeSlug)
    )
    .innerJoin(ProfileTable, eq(ProfileTable.userId, RecipesTable.createdBy))
    .where(
      and(
        eq(ProfileTable.profileSlug, profileSlug),
        sql`EXTRACT(EPOCH FROM NOW() - ${RecipesTable.createdAt}) <= ${thirtyDaysInSeconds}`
      )
    )
    .groupBy(ProfileTable.profileSlug)
    .execute()
    .then((res) => res[0]?.points || 0);
};
