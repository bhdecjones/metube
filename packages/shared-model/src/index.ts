import { z } from 'zod';

export const ProfileKindSchema = z.enum(['parent', 'child']);
export type ProfileKind = z.infer<typeof ProfileKindSchema>;

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1),
  kind: ProfileKindSchema,
  parentPin: z.string().nullish(),
  createdAt: z.string(),
});
export type Profile = z.infer<typeof ProfileSchema>;

export const ChannelSchema = z.object({
  channelId: z.string(),
  title: z.string(),
  thumbUrl: z.string().url().nullable().optional(),
});
export type Channel = z.infer<typeof ChannelSchema>;

export const VideoSchema = z.object({
  videoId: z.string(),
  channelId: z.string(),
  title: z.string(),
  durationSeconds: z.number().int().nonnegative(),
  publishedAt: z.string().nullable().optional(),
  thumbUrl: z.string().url().nullable().optional(),
});
export type Video = z.infer<typeof VideoSchema>;

export const ChannelSearchResultSchema = ChannelSchema.pick({
  channelId: true,
  title: true,
  thumbUrl: true,
});
export type ChannelSearchResult = z.infer<typeof ChannelSearchResultSchema>;

export const ProfileChannelSchema = ChannelSchema.extend({
  profileId: z.string().uuid(),
});
export type ProfileChannel = z.infer<typeof ProfileChannelSchema>;

export const CreateProfileInputSchema = z.object({
  name: z.string().min(1),
  kind: ProfileKindSchema,
});
export type CreateProfileInput = z.infer<typeof CreateProfileInputSchema>;

export const SetPinInputSchema = z.object({
  pin: z.string().min(4).max(10),
});
export type SetPinInput = z.infer<typeof SetPinInputSchema>;

export const AddChannelInputSchema = z.object({
  channelId: z.string(),
  title: z.string(),
  thumbUrl: z.string().url().nullable().optional(),
});
export type AddChannelInput = z.infer<typeof AddChannelInputSchema>;

export const VideoListQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(50).default(24),
});
export type VideoListQuery = z.infer<typeof VideoListQuerySchema>;

export const ApiErrorSchema = z.object({
  error: z.string(),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;
