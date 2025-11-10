- Verify `.env.test` exists
- Check baseURL in `playwright.config.ts`
- Confirm `npx prisma generate` succeeds
- Run `npm run build` before `qa:all`
- Clean `.next` + node cache if brand updates fail
- Re-run `qa:save-report` to push data to dashboard
- Screenshot visibility OK (no white frames)

