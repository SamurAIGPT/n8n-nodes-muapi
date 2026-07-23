import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
} from 'n8n-workflow';
import axios from 'axios';
import { uploadFile } from '../../utils/MuapiClient';

const SUPPORTED_MIME: Record<string, string> = {
  // Images
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
  tiff: 'image/tiff',
  svg: 'image/svg+xml',
  // Video
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  avi: 'video/x-msvideo',
  webm: 'video/webm',
  mkv: 'video/x-matroska',
  // Audio
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  flac: 'audio/flac',
  m4a: 'audio/mp4',
  aac: 'audio/aac',
};

function guessMimeFromFilename(filename: string): string | undefined {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return SUPPORTED_MIME[ext];
}

export class MuapiUpload implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'MuAPI Upload',
    name: 'muapiUpload',
    icon: 'file:muapi-logo.svg',
    group: ['transform'],
    version: 1,
    subtitle: '=Upload {{$parameter["inputType"] === "binaryData" ? "file" : "URL"}}',
    description: 'Upload a media file to MuAPI and get back a hosted URL',
    defaults: {
      name: 'MuAPI Upload',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'muapiApi',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Input Type',
        name: 'inputType',
        type: 'options',
        options: [
          { value: 'binaryData', name: 'Binary Data (from previous node)' },
          { value: 'url', name: 'URL (download then upload)' },
        ],
        default: 'binaryData',
        description: 'How to provide the file to upload',
      },

      // Binary data input
      {
        displayName: 'Binary Property',
        name: 'binaryPropertyName',
        type: 'string',
        default: 'data',
        required: true,
        description: 'Name of the binary property that contains the file data',
        displayOptions: {
          show: {
            inputType: ['binaryData'],
          },
        },
      },

      // URL input
      {
        displayName: 'File URL',
        name: 'fileUrl',
        type: 'string',
        default: '',
        required: true,
        description: 'URL of the file to download and upload',
        displayOptions: {
          show: {
            inputType: ['url'],
          },
        },
      },
      {
        displayName: 'Filename',
        name: 'filename',
        type: 'string',
        default: '',
        description: 'Optional filename override (including extension, e.g. "photo.jpg")',
        displayOptions: {
          show: {
            inputType: ['url'],
          },
        },
      },

      {
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        options: [
          {
            displayName: 'Continue On Fail',
            name: 'continueOnFail',
            type: 'boolean',
            default: false,
          },
        ],
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const credentials = await this.getCredentials('muapiApi');
    const apiKey = credentials.apiKey as string;
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      const inputType = this.getNodeParameter('inputType', i) as string;

      try {
        let fileBuffer: Buffer;
        let mimeType: string;
        let filename: string;

        if (inputType === 'binaryData') {
          const binaryPropName = this.getNodeParameter('binaryPropertyName', i) as string;
          const binaryData = this.helpers.assertBinaryData(i, binaryPropName);

          fileBuffer = await this.helpers.getBinaryDataBuffer(i, binaryPropName);
          mimeType = binaryData.mimeType ?? 'application/octet-stream';
          filename = binaryData.fileName ?? `upload_${Date.now()}`;
        } else {
          const fileUrl = this.getNodeParameter('fileUrl', i) as string;
          const filenameOverride = this.getNodeParameter('filename', i) as string;

          // Download the file
          const response = await axios.get<Buffer>(fileUrl, {
            responseType: 'arraybuffer',
            timeout: 120_000,
          });

          fileBuffer = Buffer.from(response.data);

          // Determine filename + mime
          filename = filenameOverride || fileUrl.split('/').pop()?.split('?')[0] || `upload_${Date.now()}`;
          const contentType = (response.headers['content-type'] as string) ?? '';
          mimeType =
            contentType.split(';')[0].trim() ||
            guessMimeFromFilename(filename) ||
            'application/octet-stream';
        }

        // Override mime from filename if content-type is generic
        if (mimeType === 'application/octet-stream' || !mimeType) {
          mimeType = guessMimeFromFilename(filename) ?? mimeType;
        }

        const uploadResult = await uploadFile(fileBuffer, mimeType, filename, apiKey);

        returnData.push({
          json: {
            ...uploadResult,
            filename,
            mimeType,
            size: fileBuffer.length,
          },
          pairedItem: i,
        });
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: { error: (error as Error).message },
            pairedItem: i,
          });
        } else {
          throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
        }
      }
    }

    return [returnData];
  }
}
