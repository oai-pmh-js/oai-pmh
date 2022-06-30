import { VerbsAndFieldsForList } from './general';

export interface OaiPmhParserInterface {
  GetResumptionToken(result: any): string | null;

  ParseOaiPmhXml(xml: string): any;

  ParseIdentify(obj: any): any;

  ParseMetadataFormats(obj: any): any;

  ParseRecord(obj: any): any;

  ParseList<T extends keyof VerbsAndFieldsForList>(
    obj: any,
    verb: T,
    field: VerbsAndFieldsForList[T],
  ): any;
}
