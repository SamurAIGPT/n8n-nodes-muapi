import {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class MuapiApi implements ICredentialType {
  name = 'muapiApi';
  displayName = 'MuAPI API';
  documentationUrl = 'https://docs.muapi.ai';
  icon = 'file:muapi-logo.svg' as const;
  properties: INodeProperties[] = [
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
      description: 'Your MuAPI API key. Get one at https://muapi.ai/dashboard/keys',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        'x-api-key': '={{$credentials.apiKey}}',
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: 'https://api.muapi.ai',
      url: '/api/v1/account/balance',
      method: 'GET',
    },
  };
}
