import { Database } from 'bun:sqlite';
import * as fs from 'fs';
import * as path from 'path';

export async function runBackupSnapshot() {
	try {
		const dbPath = process.env.DATABASE_PATH || 'local.db';
		const dbDir = path.dirname(dbPath);
		const backupsDir = path.join(dbDir, 'backups');

		if (!fs.existsSync(backupsDir)) {
			fs.mkdirSync(backupsDir, { recursive: true });
		}

		const tempBackupPath = path.join(backupsDir, 'temp_snapshot.db');

		// 1. Vacuum into a temporary file
		if (fs.existsSync(tempBackupPath)) {
			fs.unlinkSync(tempBackupPath);
		}

		const db = new Database(dbPath);
		db.run(`VACUUM INTO '${tempBackupPath}';`);
		db.close();

		if (!fs.existsSync(tempBackupPath)) {
			console.error('Failed to create temporary SQLite snapshot.');
			return;
		}

		// 2. Hash check to avoid redundant backups
		const tempBuffer = fs.readFileSync(tempBackupPath);
		const tempHash = Bun.hash(tempBuffer).toString();

		// Find the latest snapshot in the backup directory
		const files = fs.readdirSync(backupsDir)
			.filter(f => f.startsWith('snapshot_') && f.endsWith('.db'))
			.sort();

		const latestFile = files[files.length - 1];
		if (latestFile) {
			const latestPath = path.join(backupsDir, latestFile);
			const latestBuffer = fs.readFileSync(latestPath);
			const latestHash = Bun.hash(latestBuffer).toString();

			if (tempHash === latestHash) {
				console.log('Database state unchanged since last snapshot. Skipping snapshot creation.');
				fs.unlinkSync(tempBackupPath);
				return;
			}
		}

		// 3. Rename temporary backup to the permanent timestamped filename
		const now = new Date();
		const pad = (n: number) => String(n).padStart(2, '0');
		const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
		const finalBackupPath = path.join(backupsDir, `snapshot_${timestamp}.db`);

		fs.renameSync(tempBackupPath, finalBackupPath);
		console.log(`Successfully created a new SQLite database snapshot: ${finalBackupPath}`);

		// 4. Clean up older backups (keep last 7 copies)
		const updatedFiles = fs.readdirSync(backupsDir)
			.filter(f => f.startsWith('snapshot_') && f.endsWith('.db'))
			.sort();
		if (updatedFiles.length > 7) {
			const filesToDelete = updatedFiles.slice(0, updatedFiles.length - 7);
			for (const fileToDelete of filesToDelete) {
				const deletePath = path.join(backupsDir, fileToDelete);
				fs.unlinkSync(deletePath);
				console.log(`Deleted old backup snapshot: ${fileToDelete}`);
			}
		}
	} catch (error) {
		console.error('Error running SQLite snapshot backup:', error);
	}
}
