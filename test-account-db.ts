import { db } from './src/lib/server/db';
import { user } from './src/lib/server/db/schema';
import { eq } from 'drizzle-orm';

async function test() {
    const users = await db.select().from(user).limit(1);
    
    if (users.length === 0) {
        console.log("No users found");
        return;
    }
    
    const currentUser = users[0];
    console.log("User:", currentUser);
    console.log("createdAt type:", typeof currentUser.createdAt);
    console.log("createdAt constructor:", currentUser.createdAt?.constructor?.name);
    
    try {
        console.log(currentUser.createdAt.toISOString());
    } catch (e) {
        console.error("Error calling toISOString:", e.message);
    }
}

test().catch(console.error);
