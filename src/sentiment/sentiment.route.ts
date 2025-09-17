import { db } from '../drizzle/db.ts';
import { Hono } from 'hono';
import {
  postSentimentScore,
  commentAnalysis,
  post,
} from '../drizzle/schema.ts';
import { eq, count, avg, desc, asc, gte, sql } from 'drizzle-orm';

export const sentimentRoute = new Hono();

sentimentRoute.get('/post/:postId', async (c) => {
  const postId = c.req.param('postId');

  const sentiment = await db
    .select()
    .from(postSentimentScore)
    .where(eq(postSentimentScore.postId, postId))
    .limit(1);

  if (sentiment.length === 0) {
    return c.json({ error: 'Post sentiment not found' }, 404);
  }

  return c.json(sentiment[0]);
});

// 1. Vue d'ensemble globale
sentimentRoute.get('/overview', async (c) => {
  // Nombre total de posts analysés
  const totalPosts = await db
    .select({ count: count() })
    .from(postSentimentScore);

  // Répartition globale des sentiments
  const sentimentDistribution = await db
    .select({
      sentiment: postSentimentScore.finalLabel,
      count: count(),
    })
    .from(postSentimentScore)
    .groupBy(postSentimentScore.finalLabel);

  // Score de sentiment moyen (basé sur les scores positifs)
  const avgSentiment = await db
    .select({
      avgPositive: avg(postSentimentScore.positive),
      avgNeutral: avg(postSentimentScore.neutral),
      avgNegative: avg(postSentimentScore.negative),
    })
    .from(postSentimentScore);

  // Évolution sur les 30 derniers jours
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentTrends = await db
    .select({
      date: sql`DATE(${post.postCreatedAt})`.as('date'),
      sentiment: postSentimentScore.finalLabel,
      count: count(),
    })
    .from(postSentimentScore)
    .innerJoin(post, eq(postSentimentScore.postId, post.postId))
    .where(gte(post.postCreatedAt, thirtyDaysAgo))
    .groupBy(sql`DATE(${post.postCreatedAt})`, postSentimentScore.finalLabel)
    .orderBy(sql`DATE(${post.postCreatedAt})`);

  return c.json({
    totalPosts: totalPosts[0]?.count || 0,
    sentimentDistribution,
    averageScores: avgSentiment[0],
    thirtyDayTrends: recentTrends,
  });
});

// 2. Top posts par sentiment
sentimentRoute.get('/posts/top', async (c) => {
  const { sentiment = 'positive', limit = '10' } = c.req.query();
  const limitNum = parseInt(limit as string) || 10;

  let orderColumn;
  let orderDirection = desc;

  switch (sentiment) {
    case 'positive':
      orderColumn = postSentimentScore.positive;
      break;
    case 'negative':
      orderColumn = postSentimentScore.negative;
      break;
    case 'neutral':
      orderColumn = postSentimentScore.neutral;
      break;
    default:
      orderColumn = postSentimentScore.positive;
  }

  const topPosts = await db
    .select({
      postId: post.postId,
      messageText: post.messageText,
      postCreatedAt: post.postCreatedAt,
      username: post.username,
      reactionCount: post.reactionCount,
      commentCount: post.commentCount,
      shareCount: post.shareCount,
      videoViewCount: post.videoViewCount,
      positive: postSentimentScore.positive,
      neutral: postSentimentScore.neutral,
      negative: postSentimentScore.negative,
      finalLabel: postSentimentScore.finalLabel,
    })
    .from(postSentimentScore)
    .innerJoin(post, eq(postSentimentScore.postId, post.postId))
    .orderBy(orderDirection(orderColumn))
    .limit(limitNum);

  return c.json(topPosts);
});

// 3. Analyse temporelle
sentimentRoute.get('/trends', async (c) => {
  const { period = '30d' } = c.req.query();

  let daysBack = 30;
  switch (period) {
    case '7d':
      daysBack = 7;
      break;
    case '30d':
      daysBack = 30;
      break;
    case '90d':
      daysBack = 90;
      break;
    default:
      daysBack = 30;
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  const previousStartDate = new Date(startDate);
  previousStartDate.setDate(previousStartDate.getDate() - daysBack);

  // Tendances pour la période demandée
  const currentTrends = await db
    .select({
      date: sql`DATE(${post.postCreatedAt})`.as('date'),
      sentiment: postSentimentScore.finalLabel,
      count: count(),
      avgPositive: avg(postSentimentScore.positive),
      avgNeutral: avg(postSentimentScore.neutral),
      avgNegative: avg(postSentimentScore.negative),
    })
    .from(postSentimentScore)
    .innerJoin(post, eq(postSentimentScore.postId, post.postId))
    .where(gte(post.postCreatedAt, startDate))
    .groupBy(sql`DATE(${post.postCreatedAt})`, postSentimentScore.finalLabel)
    .orderBy(sql`DATE(${post.postCreatedAt})`);

  // Comparaison avec la période précédente
  const previousTrends = await db
    .select({
      sentiment: postSentimentScore.finalLabel,
      count: count(),
      avgPositive: avg(postSentimentScore.positive),
      avgNeutral: avg(postSentimentScore.neutral),
      avgNegative: avg(postSentimentScore.negative),
    })
    .from(postSentimentScore)
    .innerJoin(post, eq(postSentimentScore.postId, post.postId))
    .where(gte(post.postCreatedAt, previousStartDate))
    .where(sql`${post.postCreatedAt} < ${startDate}`)
    .groupBy(postSentimentScore.finalLabel);

  return c.json({
    period,
    currentPeriod: {
      dailyTrends: currentTrends,
      startDate: startDate.toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
    },
    previousPeriod: {
      aggregatedData: previousTrends,
      startDate: previousStartDate.toISOString().split('T')[0],
      endDate: startDate.toISOString().split('T')[0],
    },
  });
});

// 4. Corrélations engagement/sentiment
sentimentRoute.get('/correlations', async (c) => {
  // Corrélation entre sentiment et engagement
  const correlationData = await db
    .select({
      postId: post.postId,
      messageText: post.messageText,
      reactionCount: post.reactionCount,
      commentCount: post.commentCount,
      shareCount: post.shareCount,
      videoViewCount: post.videoViewCount,
      positive: postSentimentScore.positive,
      neutral: postSentimentScore.neutral,
      negative: postSentimentScore.negative,
      finalLabel: postSentimentScore.finalLabel,
      totalEngagement:
        sql`${post.reactionCount} + ${post.commentCount} + ${post.shareCount} + COALESCE(${post.videoViewCount}, 0)`.as(
          'totalEngagement',
        ),
    })
    .from(postSentimentScore)
    .innerJoin(post, eq(postSentimentScore.postId, post.postId));

  // Posts avec fort engagement positif
  const highPositiveEngagement = await db
    .select({
      postId: post.postId,
      messageText: post.messageText,
      reactionCount: post.reactionCount,
      commentCount: post.commentCount,
      shareCount: post.shareCount,
      positive: postSentimentScore.positive,
      totalEngagement:
        sql`${post.reactionCount} + ${post.commentCount} + ${post.shareCount}`.as(
          'totalEngagement',
        ),
    })
    .from(postSentimentScore)
    .innerJoin(post, eq(postSentimentScore.postId, post.postId))
    .where(eq(postSentimentScore.finalLabel, 'positive'))
    .orderBy(
      desc(
        sql`${post.reactionCount} + ${post.commentCount} + ${post.shareCount}`,
      ),
    )
    .limit(10);

  // Posts avec fort engagement négatif
  const highNegativeEngagement = await db
    .select({
      postId: post.postId,
      messageText: post.messageText,
      reactionCount: post.reactionCount,
      commentCount: post.commentCount,
      shareCount: post.shareCount,
      negative: postSentimentScore.negative,
      totalEngagement:
        sql`${post.reactionCount} + ${post.commentCount} + ${post.shareCount}`.as(
          'totalEngagement',
        ),
    })
    .from(postSentimentScore)
    .innerJoin(post, eq(postSentimentScore.postId, post.postId))
    .where(eq(postSentimentScore.finalLabel, 'negative'))
    .orderBy(
      desc(
        sql`${post.reactionCount} + ${post.commentCount} + ${post.shareCount}`,
      ),
    )
    .limit(10);

  // Moyennes par sentiment
  const avgEngagementBySentiment = await db
    .select({
      sentiment: postSentimentScore.finalLabel,
      avgReactions: avg(post.reactionCount),
      avgComments: avg(post.commentCount),
      avgShares: avg(post.shareCount),
      avgVideoViews: avg(post.videoViewCount),
      count: count(),
    })
    .from(postSentimentScore)
    .innerJoin(post, eq(postSentimentScore.postId, post.postId))
    .groupBy(postSentimentScore.finalLabel);

  return c.json({
    correlationData: correlationData.slice(0, 100), // Limiter pour éviter trop de données
    topPositiveEngagement: highPositiveEngagement,
    topNegativeEngagement: highNegativeEngagement,
    averageEngagementBySentiment: avgEngagementBySentiment,
  });
});

// 5. Analyse des commentaires agrégée
sentimentRoute.get('/comments/overview', async (c) => {
  try {
    // Compter le total des commentaires
    const totalComments = await db
      .select({ count: count() })
      .from(commentAnalysis);

    // Répartition des sentiments dans les commentaires
    const commentSentimentDistribution = await db
      .select({
        sentiment: commentAnalysis.label,
        count: count(),
      })
      .from(commentAnalysis)
      .groupBy(commentAnalysis.label);

    // Posts générant le plus de commentaires positifs
    const topPositiveCommentsPosts = await db
      .select({
        postId: commentAnalysis.postId,
        positiveCommentsCount: count(),
      })
      .from(commentAnalysis)
      .where(eq(commentAnalysis.label, 'positive'))
      .groupBy(commentAnalysis.postId)
      .orderBy(desc(count()))
      .limit(10);

    // Posts générant le plus de commentaires négatifs
    const topNegativeCommentsPosts = await db
      .select({
        postId: commentAnalysis.postId,
        negativeCommentsCount: count(),
      })
      .from(commentAnalysis)
      .where(eq(commentAnalysis.label, 'negative'))
      .groupBy(commentAnalysis.postId)
      .orderBy(desc(count()))
      .limit(10);

    // Moyennes des scores de sentiment des commentaires
    const avgCommentScores = await db
      .select({
        avgPositive: avg(commentAnalysis.scorePositive),
        avgNeutral: avg(commentAnalysis.scoreNeutral),
        avgNegative: avg(commentAnalysis.scoreNegative),
      })
      .from(commentAnalysis);

    return c.json({
      totalComments: totalComments[0]?.count || 0,
      commentSentimentDistribution,
      topPositiveCommentsPosts,
      topNegativeCommentsPosts,
      averageCommentScores: avgCommentScores[0] || null,
      hasData: commentSentimentDistribution.length > 0,
    });
  } catch (error) {
    console.error('Error in comments/overview:', error);
    return c.json(
      {
        error: 'Internal server error',
        details: error.message,
        totalComments: 0,
        hasData: false,
      },
      500,
    );
  }
});

sentimentRoute.get('/comments/:postId', async (c) => {
  const postId = c.req.param('postId');

  const comments = await db
    .select()
    .from(commentAnalysis)
    .where(eq(commentAnalysis.postId, postId));

  return c.json(comments);
});
