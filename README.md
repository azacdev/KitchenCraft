![kitchencraft](https://github.com/jonmumm/KitchenCraft/assets/718391/085de972-a71b-4d9b-b5ea-ef463afee322)

# KitchenCraft.ai

The personal AI cookbook.

## Developing

Clone the repo. Run `npm install`

Run the frontend with `npm run dev`.
Run the backend with `npx partykit dev`.

You will also need to configure your environment according to the values in `src/env.public.ts` and `src/env.secrets.ts`.

Developed using node 18 and npm 9.

## Deploy to Vercel

TODO setup `.env.example` based on `src/env.public.ts` and `src/env.private.ts`.

## License

This project is licensed under the AGPL-3.0, a strong copyleft license. It mandates that if you modify and run a modified version of this software on a server or network, you must also offer the source code of your modified version to your users. This ensures that the freedom to modify and redistribute the software (even when running on servers) is preserved, promoting transparency and community contributions.

See [LICENSE.md](/LICENSE.md) for more.

## Stream Tests

To run test for a prompt, use something similar to this command:
 
```
npm run test related src/app/full-recipe.stream.test.ts
```
