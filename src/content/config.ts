import { defineCollection, z } from "astro:content";

const epk = defineCollection({
  // Type-check frontmatter using a schema
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      artistBio: z.string(),
      // Transform string to Date object
      pubDate: z.coerce.date(),
      heroImage: image()
        .refine((img) => img.width >= 300, {
          message: "Cover image must be at least 300 pixels wide!",
        })
        .optional(),
      pressPhotos: z.array(image()).optional(),
      pressLinks: z.array(z.string()).optional(),
      socials: z
        .array(
          z.object({
            title: z.string().optional(),
            link: z.string(),
          })
        )
        .optional(),
      contacts: z
        .array(
          z.object({
            title: z.string(),
            link: z.string(),
          })
        )
        .optional(),
      techRider: z
        .object({
          title: z.string(),
          link: z.string(),
        })
        .optional(),
      tags: z.array(z.string()).optional(),
      archive: z.boolean().default(false),
    }),
});

export const collections = { epk: epk };
