import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  serial,
  uniqueIndex,
  decimal,
} from "drizzle-orm/pg-core";

export const post = pgTable("post", {
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  postId: text("post_id").primaryKey(),
  userId: text("user_id").notNull(),
  username: text("username").notNull(),
  postCreatedAt: timestamp("post_created_at").notNull(),
  mediaType: text("media_type"),
  messageText: text("message_text"),
  commentCount: integer("comment_count").default(0),
  shareCount: integer("share_count").default(0),
  reactionCount: integer("reaction_count").default(0),
  videoViewCount: integer("video_view_count").default(0),
  permalink: text("permalink"),
  photoImageUri: text("photo_image_uri"),
  photoPageUrl: text("photo_page_url"),
  carousels: jsonb("carousels"),
});

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    password: text("password").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (users) => {
    return {
      uniqueIdx: uniqueIndex("unique_idx").on(users.email),
    };
  },
);

export const postSentimentScore = pgTable("post_sentiment_score", {
  postId: text("post_id").primaryKey(),
  positive: decimal("positive"),
  neutral: decimal("neutral"),
  negative: decimal("negative"),
  finalLabel: text("final_label"),
});

export const commentAnalysis = pgTable("comment_analysis", {
  userId: text("user_id"),
  postId: text("post_id"),
  commentId: text("comment_id").primaryKey(),
  label: text("label"),
  scorePositive: decimal("score_positive"),
  scoreNegative: decimal("score_negative"),
  scoreNeutral: decimal("score_neutral"),
});
