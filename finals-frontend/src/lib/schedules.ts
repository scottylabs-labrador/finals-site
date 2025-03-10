"use server";

import prisma from '@/lib/prisma';

export async function getSchedule(userId: string | null | undefined) {
    if (!userId) {
        return null;
    }
    const user = await prisma.user.findUnique({
    where: {
        clerkId: userId,
    },
    });

    if (user && user.schedule) {
    return JSON.parse(user.schedule);
    } else {
    return null;
    }
}

export async function postSchedule(userId: string | null | undefined, schedule: string) {
    if (!userId) {
        return Response.json(false);
    }
    const data = await prisma.user.upsert({
        where: {
            clerkId: userId,
        },
        create: {
            clerkId: userId,
            schedule,
        },
        update: {
            schedule,
        },
    });

    return data !== null
}
