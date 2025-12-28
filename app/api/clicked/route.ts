import { NextResponse } from "next/server";

import {
    appendClicked,
    getClickedLogPath,
    readClickedLog,
    resetClickedLog,
} from "@/lib/clicked-log-manager";

export async function GET() {
    const log = await readClickedLog();

    return NextResponse.json({
        ...log,
        totalClicked: log.clickedNumbers.length,
        logPath: getClickedLogPath(),
    });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Support both single number and array of numbers
        const numbers: string[] = [];
        if (typeof body.number === "string") {
            numbers.push(body.number);
        }
        if (Array.isArray(body.numbers)) {
            numbers.push(...body.numbers.map(String));
        }

        if (numbers.length === 0) {
            return NextResponse.json(
                { error: "No number provided" },
                { status: 400 },
            );
        }

        const log = await appendClicked(numbers);

        return NextResponse.json({
            success: true,
            ...log,
            totalClicked: log.clickedNumbers.length,
            logPath: getClickedLogPath(),
        });
    } catch (error) {
        console.error("Failed to mark number as clicked", error);
        return NextResponse.json(
            { error: "Failed to update clicked log" },
            { status: 500 },
        );
    }
}

export async function DELETE() {
    const log = await resetClickedLog();

    return NextResponse.json({
        success: true,
        ...log,
        totalClicked: 0,
        logPath: getClickedLogPath(),
    });
}
