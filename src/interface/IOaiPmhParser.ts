export interface IOaiPmhParser {
  GetResumptionToken(result: any): string | null;

  ParseOaiPmhXml(xml: string): any;

  ParseIdentify(obj: any): any;

  ParseMetadataFormats(obj: any): any;

  ParseRecord(obj: any): any;

  ParseList(obj: any, verb: string, field: string): any;
}
