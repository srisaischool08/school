# Deploying to Render

The repository includes a Render Blueprint in `render.yaml`. It deploys the frontend and API together, so the site and `/api` requests use one public URL.

## Deploy

1. Push this project to a private GitHub repository. Include `render.yaml`, `package.json`, and `package-lock.json`. Do not commit `.env`, a local database, or private student records.
2. Create or sign in to a Render account, connect GitHub, and select **New + → Blueprint**.
3. Select the repository and branch containing `render.yaml`. During Blueprint setup, enter:
   - `ADMIN_USERNAME`: the first administrator's login name (at least 3 characters).
   - `ADMIN_PASSWORD`: a unique password with at least 16 characters.
4. Confirm the `srisai-model-school` web service uses the **Starter** plan and has the configured 1 GB persistent disk. A free web service is not suitable: it sleeps when idle and loses local files, including SQLite databases and uploads.
5. Apply the Blueprint and wait for the deployment to report healthy. Do not use the public site or enter new records until you complete the data migration below. The first deploy creates a temporary database on the persistent disk; the migration replaces it with your current local database before the site is used.

Render generates `JWT_SECRET` for the service. Keep it private and do not change it after users have logged in unless you intend to invalidate all existing login tokens. The admin bootstrap reads its credentials only when the database has no `SUPER_ADMIN`; later restarts and deploys do not reset the password.

## Migrate existing data before opening the site

1. Stop the local app so no records are being written. From the project root, run `npm run backup:render-data`. It finds the SQLite database configured for this project, checkpoints it, and writes `srisai.db` plus the configured uploads folder into a timestamped `render-migration-*` folder. That folder is git-ignored because it contains private school data; do not commit or share it.
2. Set up SSH access for Render using the service's **SSH** page and Render account settings. Keep the private SSH key on your computer; add only its public key to Render. Use the SSH/SCP target shown by Render for your service.
3. From a Windows terminal in the project root, transfer the files to staging names on the service (replace the local backup path and SSH target with yours):

   ```powershell
   $backup = ".\render-migration-YYYY-MM-DDTHH-MM-SS-000Z"
   $sshTarget = "RENDER_SSH_USER_AND_HOST"
   scp "$backup\srisai.db" "${sshTarget}:/var/data/srisai.db.import"
   scp -r "$backup\uploads" "${sshTarget}:/var/data/uploads-import"
   ```

4. Open the service's **Shell** page in Render and move the staged files into place:

   ```sh
   mv /var/data/srisai.db /var/data/srisai.db.initial
   mv /var/data/srisai.db.import /var/data/srisai.db
   mv /var/data/uploads /var/data/uploads.initial
   mv /var/data/uploads-import /var/data/uploads
   ```

   The `.initial` files are a rollback copy of the temporary database and uploads; keep them until you have verified the migrated site.
5. Restart the Render service from its dashboard. Its normal startup syncs the schema without reseeding development CSVs and does not replace existing records. If the imported database already contains a `SUPER_ADMIN`, sign in with that account's existing credentials; the bootstrap credentials only create an admin for a database that has none.
6. Open the `onrender.com` URL shown on the service's Render dashboard, then append `/login`. Verify students, teachers, attendance, fees, assignments, results, and gallery images before inviting other users.

If `scp` asks for a port or different SSH options, use the exact host/options provided by Render's SSH page. The Render persistent disk is mounted at `/var/data`; the database is `/var/data/srisai.db` and gallery files are `/var/data/uploads`. Render preserves both across restarts and deployments. Keep the service at one instance because a persistent disk is attached to only one instance.

Production startup does not import development CSVs. Migrating the SQLite database copies its existing users and school records together, including login hashes, attendance, fees, assignments, exams/results, and gallery metadata. The corresponding upload files are transferred separately so existing `/uploads/...` paths keep working.

Render assigns the stable public `https://<service-name>.onrender.com` address after creation. That URL can be opened from phones and other computers while the paid service remains active. A custom domain is optional; it requires owning a domain and configuring its DNS in Render.
