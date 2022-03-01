import { VerbsAndFields } from '../types/general';

export interface IOaiPmhParser {
  GetResumptionToken(result: any): string | null;

  ParseOaiPmhXml(xml: string): any;

  ParseIdentify(obj: any): any;

  ParseMetadataFormats(obj: any): any;

  ParseRecord(obj: any): any;

  ParseList<T extends keyof VerbsAndFields>(
    obj: any,
    verb: T,
    field: VerbsAndFields[T],
  ): any;
}
