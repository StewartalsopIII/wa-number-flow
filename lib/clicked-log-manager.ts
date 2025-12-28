import { promises as fs } from "fs";
import path from "path";

export interface ClickedLog {
    clickedNumbers: string[];
    lastUpdated: string;
}

const DEFAULT_LOG: ClickedLog = {
    clickedNumbers: [],
    lastUpdated: new Date(0).toISOString(),
};

function getEnvClickedLogPath(): string | undefined {
    const customPath = process.env.CLICKED_LOG_PATH;
    if (!customPath) {
        return undefined;
    }
    return path.isAbsolute(customPath)
        ? customPath
        : path.resolve(process.cwd(), customPath);
}

export function getClickedLogPath(): string {
    const envPath = getEnvClickedLogPath();
    if (envPath) {
        return envPath;
    }

    return path.join(process.cwd(), "public", "clicked_numbers.json");
}

async function ensureClickedLogFile(): Promise<void> {
    const logPath = getClickedLogPath();

    try {
        await fs.access(logPath);
    } catch {
        const directory = path.dirname(logPath);
        await fs.mkdir(directory, { recursive: true });
        await fs.writeFile(
            logPath,
            JSON.stringify(
                {
                    clickedNumbers: [],
                    lastUpdated: new Date().toISOString(),
                },
                null,
                2,
            ),
            "utf8",
        );
    }
}

export async function readClickedLog(): Promise<ClickedLog> {
    await ensureClickedLogFile();
    const logPath = getClickedLogPath();

    try {
        const content = await fs.readFile(logPath, "utf8");
        const parsed = JSON.parse(content) as Partial<ClickedLog>;

        if (!Array.isArray(parsed.clickedNumbers)) {
            return { ...DEFAULT_LOG, lastUpdated: new Date().toISOString() };
        }

        return {
            clickedNumbers: parsed.clickedNumbers.map(String),
            lastUpdated: parsed.lastUpdated ?? new Date().toISOString(),
        };
    } catch (error) {
        console.error("Failed to read clicked_numbers.json", error);
        throw new Error("Unable to read clicked numbers log");
    }
}

export async function writeClickedLog(numbers: string[]): Promise<ClickedLog> {
    const unique = Array.from(new Set(numbers));
    const payload: ClickedLog = {
        clickedNumbers: unique,
        lastUpdated: new Date().toISOString(),
    };

    const logPath = getClickedLogPath();
    await fs.writeFile(logPath, JSON.stringify(payload, null, 2), "utf8");
    return payload;
}

export async function appendClicked(newNumbers: string[]): Promise<ClickedLog> {
    const current = await readClickedLog();
    const combined = Array.from(new Set([...current.clickedNumbers, ...newNumbers]));
    return writeClickedLog(combined);
}

export async function resetClickedLog(): Promise<ClickedLog> {
    const logPath = getClickedLogPath();
    await fs.writeFile(
        logPath,
        JSON.stringify(
            {
                clickedNumbers: [],
                lastUpdated: new Date().toISOString(),
            },
            null,
            2,
        ),
        "utf8",
    );

    return readClickedLog();
}
