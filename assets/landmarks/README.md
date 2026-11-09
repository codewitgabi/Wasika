# Landmark photos

Put one photo per landmark here, named by its slug from `lib/landmarks.ts`:

- `zuma-rock.jpg`
- `gurara-falls.jpg`
- `kainji-lake.jpg`
- `zungeru-dam.jpg`
- `juju-rock.jpg`

`.jpeg`, `.png` and `.webp` also work. Keep each under 10 MB (the Cloudinary free plan limit) and at least 1200 px wide, or the postcard comes out blurry. Only use photos you have the right to use.

Then run `pnpm landmarks:upload`. Each photo goes to Cloudinary as `landmarks/<slug>`; re-running replaces it.
