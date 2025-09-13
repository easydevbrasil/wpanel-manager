import { useEffect } from 'react';
import * as monaco from 'monaco-editor';

export function useMonacoNginx() {
  useEffect(() => {
    // Register Nginx language if not already registered
    const languages = monaco.languages.getLanguages();
    const nginxExists = languages.some(lang => lang.id === 'nginx');

    if (!nginxExists) {
      // Register Nginx language
      monaco.languages.register({
        id: 'nginx'
      });

      // Define Nginx syntax highlighting
      monaco.languages.setMonarchTokensProvider('nginx', {
        tokenizer: {
          root: [
            // Comments
            [/#.*$/, 'comment'],
            
            // Directives
            [/\b(server|location|upstream|proxy_pass|listen|server_name|root|index|try_files|error_page|access_log|error_log|return|rewrite|proxy_set_header|proxy_redirect|client_max_body_size|keepalive_timeout|gzip|ssl_certificate|ssl_certificate_key|ssl_protocols|ssl_ciphers|add_header|if|set|fastcgi_pass|fastcgi_param|include)\b/, 'keyword'],
            
            // HTTP methods and status codes
            [/\b(GET|POST|PUT|DELETE|HEAD|OPTIONS|PATCH|200|301|302|404|500|502|503)\b/, 'number'],
            
            // Variables
            [/\$[a-zA-Z_][a-zA-Z0-9_]*/, 'variable'],
            
            // Strings
            [/"([^"\\]|\\.)*$/, 'string.invalid'],
            [/"/, 'string', '@string_double'],
            [/'([^'\\]|\\.)*$/, 'string.invalid'],
            [/'/, 'string', '@string_single'],
            
            // Numbers
            [/\d+[kKmMgG]?[bB]?/, 'number'],
            [/\d+/, 'number'],
            
            // Operators
            [/[{}()[\]]/, 'delimiter.bracket'],
            [/[;]/, 'delimiter'],
            
            // URLs and paths
            [/\/[^\s;{}]*/, 'string.escape'],
            
            // IP addresses
            [/\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/, 'number'],
            
            // Ports
            [/:[0-9]+/, 'number'],
          ],
          
          string_double: [
            [/[^\\"]+/, 'string'],
            [/\\./, 'string.escape'],
            [/"/, 'string', '@pop']
          ],
          
          string_single: [
            [/[^\\']+/, 'string'],
            [/\\./, 'string.escape'],
            [/'/, 'string', '@pop']
          ]
        }
      });

      // Define auto-completion for Nginx
      monaco.languages.registerCompletionItemProvider('nginx', {
        provideCompletionItems: (model, position) => {
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn
          };

          const suggestions = [
            {
              label: 'server',
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: 'server {\n\t$0\n}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Server block',
              range: range
            },
            {
              label: 'location',
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: 'location $1 {\n\t$0\n}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Location block',
              range: range
            },
            {
              label: 'proxy_pass',
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: 'proxy_pass $1;',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Proxy pass directive',
              range: range
            },
            {
              label: 'listen',
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: 'listen $1;',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Listen directive',
              range: range
            },
            {
              label: 'server_name',
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: 'server_name $1;',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Server name directive',
              range: range
            },
            {
              label: 'ssl_certificate',
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: 'ssl_certificate $1;',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'SSL certificate path',
              range: range
            },
            {
              label: 'ssl_certificate_key',
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: 'ssl_certificate_key $1;',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'SSL certificate key path',
              range: range
            }
          ];

          return { suggestions };
        }
      });
    }
  }, []);
}
