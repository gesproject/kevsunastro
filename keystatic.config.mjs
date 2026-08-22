import { collection, config, fields, singleton } from "@keystatic/core";

const image = (directory, publicPath, label, description) =>
  fields.image({ directory, publicPath, label, description });

const withValidator = (field, validate) => {
  const validateField = field.validate;
  return { ...field, validate: (value) => (validateField(value), validate(value), value) };
};

const hasScheme = (value, schemes) => {
  try {
    return schemes.includes(new URL(value).protocol);
  } catch {
    return false;
  }
};

const url = (options, isAllowed, message) =>
  withValidator(fields.url(options), (value) => {
    if (value !== null && !isAllowed(value)) throw new Error(message);
  });

const calendarDate = (label) =>
  withValidator(fields.date({ label, validation: { isRequired: true } }), (value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value) {
      throw new Error("Use a real calendar date in YYYY-MM-DD format.");
    }
  });

const httpsUrl = (label, description) =>
  url({ label, description }, (value) => hasScheme(value, ["https:"]), "Use an HTTPS URL.");

const priority = fields.integer({
  label: "Display priority",
  defaultValue: 100,
  description: "Lower numbers appear first. Use whole numbers from 0 to 999.",
  validation: { isRequired: true, min: 0, max: 999 },
});

export default config({
  storage: {
    kind: "github",
    repo: "gesproject/kevsunastro",
    branchPrefix: "keystatic/",
  },
  ui: {
    brand: { name: "Sölbo" },
    navigation: { Content: ["shows", "releases", "links", "site"] },
  },
  collections: {
    shows: collection({
      label: "Shows",
      slugField: "venue",
      path: "src/content/shows/*",
      format: "json",
      columns: ["date", "venue", "city", "status", "priority"],
      schema: {
        date: calendarDate("Date"),
        venue: fields.slug({
          name: { label: "Venue", validation: { isRequired: true, pattern: { regex: /\S/, message: "Venue cannot be blank." } } },
          slug: { label: "Record ID", description: "Stable filename used by the site." },
        }),
        city: fields.text({
          label: "City",
          validation: { isRequired: true, pattern: { regex: /\S/, message: "City cannot be blank." } },
        }),
        country: fields.text({
          label: "Country code",
          description: "Two-letter uppercase ISO country code, for example CA.",
          validation: { isRequired: true, pattern: { regex: /^[A-Z]{2}$/, message: "Use a two-letter uppercase country code." } },
        }),
        status: fields.select({
          label: "Ticket status",
          defaultValue: "available",
          options: [
            { label: "Available", value: "available" },
            { label: "Sold out", value: "sold-out" },
            { label: "Free entry", value: "free" },
            { label: "Demo / TBA", value: "demo" },
          ],
        }),
        ticketUrl: httpsUrl("Ticket URL", "Required for available shows. Use the official ticket page."),
        priority,
        featuredImage: image("public/images/shows", "/images/shows/", "Show image", "Optional image displayed with this show."),
      },
    }),
    releases: collection({
      label: "Releases",
      slugField: "title",
      path: "src/content/releases/*",
      format: "json",
      columns: ["title", "releaseDate", "type", "priority"],
      schema: {
        title: fields.slug({
          name: { label: "Title", validation: { isRequired: true, pattern: { regex: /\S/, message: "Title cannot be blank." } } },
          slug: { label: "Record ID", description: "Stable filename used by the site." },
        }),
        releaseDate: calendarDate("Release date"),
        type: fields.select({
          label: "Release type",
          defaultValue: "single",
          options: [
            { label: "Single", value: "single" },
            { label: "EP", value: "ep" },
            { label: "Album", value: "album" },
          ],
        }),
        artwork: image("public/images", "/images/", "Artwork", "Optional cover artwork for this release."),
        spotifyUrl: httpsUrl("Spotify URL", "Optional official release link."),
        soundcloudUrl: httpsUrl("SoundCloud URL", "Optional official release link."),
        bandcampUrl: httpsUrl("Bandcamp URL", "Optional official release link."),
        youtubeUrl: httpsUrl("YouTube URL", "Optional official release link."),
        priority,
      },
    }),
    links: collection({
      label: "Links",
      slugField: "label",
      path: "src/content/links/*",
      format: "json",
      columns: ["label", "kind", "enabled", "priority"],
      schema: {
        label: fields.slug({
          name: { label: "Label", validation: { isRequired: true, pattern: { regex: /\S/, message: "Label cannot be blank." } } },
          slug: { label: "Record ID", description: "Stable filename used by the site." },
        }),
        kind: fields.select({
          label: "Link type",
          defaultValue: "social",
          options: [
            { label: "Listen", value: "listen" },
            { label: "Buy", value: "buy" },
            { label: "Shows", value: "shows" },
            { label: "Booking", value: "booking" },
            { label: "Social", value: "social" },
            { label: "Site", value: "site" },
          ],
        }),
        enabled: fields.checkbox({
          label: "Enabled",
          defaultValue: true,
          description: "Disable a link when its destination is not ready yet.",
        }),
        href: url(
          {
            label: "Destination",
            description: "Use an HTTPS URL, a mailto: address, or / for the site homepage. Leave empty only when disabled.",
          },
          (value) => value === "/" || hasScheme(value, ["https:", "mailto:"]),
          "Use an HTTPS URL, a mailto: address, or /.",
        ),
        priority,
      },
    }),
  },
  singletons: {
    site: singleton({
      label: "Site settings",
      path: "src/content/site/site.json",
      format: "json",
      schema: {
        artistName: fields.text({
          label: "Artist name",
          validation: { isRequired: true, pattern: { regex: /\S/, message: "Artist name cannot be blank." } },
        }),
        description: fields.text({
          label: "Description",
          multiline: true,
          validation: { isRequired: true, pattern: { regex: /\S/, message: "Description cannot be blank." } },
        }),
        location: fields.text({
          label: "Location",
          validation: { isRequired: true, pattern: { regex: /\S/, message: "Location cannot be blank." } },
        }),
        bookingEmail: fields.text({
          label: "Booking email",
          description: "Public booking address used by the contact link.",
          validation: {
            isRequired: true,
            pattern: { regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Use a valid email address." },
          },
        }),
        profileImage: image("public/images", "/images/", "Profile image", "Optional artist profile image."),
      },
    }),
  },
});
