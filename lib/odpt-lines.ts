// Maps the Japanese line names Google Directions returns (transit_details.line.name)
// to ODPT railway IDs (https://developer-dc.odpt.org/). ODPT mainly covers Kanto-area
// operators, so lines outside that area simply won't match anything here.
export type LineMapping = {
  match: RegExp;
  railwayId: string;
};

export const LINE_MAPPINGS: LineMapping[] = [
  // JR East
  { match: /山手線/, railwayId: "odpt.Railway:JR-East.Yamanote" },
  { match: /中央線快速/, railwayId: "odpt.Railway:JR-East.ChuoRapid" },
  { match: /中央・?総武線/, railwayId: "odpt.Railway:JR-East.ChuoSobuLocal" },
  { match: /京浜東北線/, railwayId: "odpt.Railway:JR-East.KeihinTohokuNegishi" },
  { match: /東海道線/, railwayId: "odpt.Railway:JR-East.Tokaido" },
  { match: /横須賀線/, railwayId: "odpt.Railway:JR-East.Yokosuka" },
  { match: /総武快速線/, railwayId: "odpt.Railway:JR-East.SobuRapid" },
  { match: /埼京線/, railwayId: "odpt.Railway:JR-East.SaikyoKawagoe" },
  { match: /湘南新宿ライン/, railwayId: "odpt.Railway:JR-East.ShonanShinjuku" },
  { match: /常磐線快速/, railwayId: "odpt.Railway:JR-East.JobanRapid" },
  { match: /常磐線/, railwayId: "odpt.Railway:JR-East.JobanLocal" },
  { match: /京葉線/, railwayId: "odpt.Railway:JR-East.Keiyo" },
  { match: /南武線/, railwayId: "odpt.Railway:JR-East.Nambu" },
  { match: /武蔵野線/, railwayId: "odpt.Railway:JR-East.Musashino" },
  { match: /青梅線/, railwayId: "odpt.Railway:JR-East.Ome" },
  { match: /川越線/, railwayId: "odpt.Railway:JR-East.Kawagoe" },

  // Tokyo Metro
  { match: /東京メトロ銀座線|銀座線/, railwayId: "odpt.Railway:TokyoMetro.Ginza" },
  { match: /東京メトロ丸ノ内線|丸ノ内線/, railwayId: "odpt.Railway:TokyoMetro.Marunouchi" },
  { match: /東京メトロ日比谷線|日比谷線/, railwayId: "odpt.Railway:TokyoMetro.Hibiya" },
  { match: /東京メトロ東西線|東西線/, railwayId: "odpt.Railway:TokyoMetro.Tozai" },
  { match: /東京メトロ千代田線|千代田線/, railwayId: "odpt.Railway:TokyoMetro.Chiyoda" },
  { match: /東京メトロ有楽町線|有楽町線/, railwayId: "odpt.Railway:TokyoMetro.Yurakucho" },
  { match: /東京メトロ半蔵門線|半蔵門線/, railwayId: "odpt.Railway:TokyoMetro.Hanzomon" },
  { match: /東京メトロ南北線|南北線/, railwayId: "odpt.Railway:TokyoMetro.Namboku" },
  { match: /東京メトロ副都心線|副都心線/, railwayId: "odpt.Railway:TokyoMetro.Fukutoshin" },

  // Toei
  { match: /都営浅草線|浅草線/, railwayId: "odpt.Railway:Toei.Asakusa" },
  { match: /都営三田線|三田線/, railwayId: "odpt.Railway:Toei.Mita" },
  { match: /都営新宿線|新宿線/, railwayId: "odpt.Railway:Toei.Shinjuku" },
  { match: /都営大江戸線|大江戸線/, railwayId: "odpt.Railway:Toei.Oedo" },

  // Major private railways
  { match: /小田急小田原線|小田急/, railwayId: "odpt.Railway:Odakyu.Odawara" },
  { match: /京王線/, railwayId: "odpt.Railway:Keio.Keio" },
  { match: /京王井の頭線/, railwayId: "odpt.Railway:Keio.Inokashira" },
  { match: /東急東横線/, railwayId: "odpt.Railway:Tokyu.Toyoko" },
  { match: /東急田園都市線/, railwayId: "odpt.Railway:Tokyu.DenEnToshi" },
  { match: /東急目黒線/, railwayId: "odpt.Railway:Tokyu.Meguro" },
  { match: /東急大井町線/, railwayId: "odpt.Railway:Tokyu.Oimachi" },
  { match: /東武東上線/, railwayId: "odpt.Railway:Tobu.Tojo" },
  { match: /東武スカイツリーライン|東武伊勢崎線/, railwayId: "odpt.Railway:Tobu.TobuSkytreeLine" },
  { match: /西武池袋線/, railwayId: "odpt.Railway:Seibu.Ikebukuro" },
  { match: /西武新宿線/, railwayId: "odpt.Railway:Seibu.Shinjuku" },
  { match: /京成本線/, railwayId: "odpt.Railway:Keisei.KeiseiMain" },
  { match: /京急本線/, railwayId: "odpt.Railway:Keikyu.KeikyuMain" },
];

export function lineNameToRailwayId(lineName: string): string | null {
  const found = LINE_MAPPINGS.find((m) => m.match.test(lineName));
  return found?.railwayId ?? null;
}
