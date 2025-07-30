import { pgTable, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";

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
