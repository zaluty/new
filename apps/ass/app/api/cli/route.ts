import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
});

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "10 s"),
  analytics: true,
});

export async function GET(req: NextRequest) {
    const ip = req.ip ?? '127.0.0.1';
    const { success } = await ratelimit.limit(ip);
    
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email');
  
        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        // Find user by email
        const users = await clerkClient().users.getUserList({ emailAddress: [email] });
        
        if (!users.data || users.data.length === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const user = users.data[0];
        
        if (!user || !user.id) {
            return NextResponse.json({ error: "Invalid user data" }, { status: 500 });
        }

        const organizations = await clerkClient.users.getOrganizationMembershipList({ userId: user.id });


        const orgData = organizations.data && organizations.data.length > 0
            ? organizations.data.map(org => ({
                id: org.organization.id,
                name: org.organization.name,
                role: org.role 
            }))
            : [];
       console.log(orgData);
        return NextResponse.json({
            userId: user.id,
            email: user.emailAddresses[0]?.emailAddress || null,
            organizations: orgData
        });
    } catch (error) {
        console.error("Error fetching user data:", error);
        return NextResponse.json({ error: "An error occurred while fetching user data" }, { status: 500 });
    }
}
