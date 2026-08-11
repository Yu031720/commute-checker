import { NextRequest, NextResponse } from "next/server";
import { lineNameToRailwayId } from "@/lib/odpt-lines";
import type { LineDelay } from "@/lib/types";

type OdptTrainInformation = {
  "odpt:railway": string;
  "odpt:trainInformationText"?: { ja?: string; en?: string } | string;
  "odpt:trainInformationStatus"?: { ja?: string; en?: string } | string;
};

function textOf(value: { ja?: string; en?: string } | string | undefined): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.ja ?? value.en ?? "";
}

export async function GET(request: NextRequest) {
  const linesParam = request.nextUrl.searchParams.get("lines");
  if (!linesParam) {
    return NextResponse.json({ error: "lines is required" }, { status: 400 });
  }

  const apiKey = process.env.ODPT_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "server missing ODPT_API_KEY" }, { status: 500 });
  }

  const lineNames = linesParam.split(",").map((s) => s.trim()).filter(Boolean);
  const uniqueLineNames = Array.from(new Set(lineNames));

  const results: LineDelay[] = await Promise.all(
    uniqueLineNames.map(async (lineName): Promise<LineDelay> => {
      const railwayId = lineNameToRailwayId(lineName);
      if (!railwayId) {
        return { lineName, status: "unmapped", text: null };
      }

      try {
        const url = new URL("https://api.odpt.org/api/v4/odpt:TrainInformation");
        url.searchParams.set("odpt:railway", railwayId);
        url.searchParams.set("acl:consumerKey", apiKey);

        const res = await fetch(url, { next: { revalidate: 60 } });
        if (!res.ok) {
          return { lineName, status: "unknown", text: null };
        }
        const data = (await res.json()) as OdptTrainInformation[];
        if (!data.length) {
          return { lineName, status: "normal", text: null };
        }

        const text = data.map((d) => textOf(d["odpt:trainInformationText"])).find((t) => t.length > 0);
        if (text) {
          return { lineName, status: "delay", text };
        }
        return { lineName, status: "normal", text: null };
      } catch {
        return { lineName, status: "unknown", text: null };
      }
    })
  );

  return NextResponse.json(results);
}
