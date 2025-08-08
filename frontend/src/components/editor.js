import Editor from '@monaco-editor/react';
import { loader } from '@monaco-editor/react';
import React, { useRef, useEffect, useState } from 'react';

// Configure Monaco loader to use a more reliable CDN
loader.config({ 
  paths: { 
    vs: 'https://unpkg.com/monaco-editor@0.52.2/min/vs' 
  } 
});

// Alternative: disable web workers if you don't need advanced features
// loader.config({
//   "vs/nls": {
//     availableLanguages: {
//       "*": "en"
//     }
//   }
// });

const CodeEditor = ({ language, value, onChange, height = "100%", width = "100%" }) => {
  const editorRef = useRef(null);
  const [isEditorReady, setIsEditorReady] = useState(false);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    setIsEditorReady(true);
    
    // Configure Monaco environment to handle worker errors gracefully
    if (typeof window !== 'undefined') {
      window.MonacoEnvironment = {
        getWorker: function (workerId, label) {
          const getWorkerModule = (moduleUrl, fallbackUrl) => {
            try {
              return new Worker(moduleUrl);
            } catch (error) {
              console.warn(`Failed to load worker from ${moduleUrl}, trying fallback...`);
              try {
                return new Worker(fallbackUrl);
              } catch (fallbackError) {
                console.warn('Both worker URLs failed, creating dummy worker');
                // Create a dummy worker that won't crash
                return new Worker(URL.createObjectURL(new Blob([''], { type: 'application/javascript' })));
              }
            }
          };

          switch (label) {
            case 'json':
              return getWorkerModule(
                'https://unpkg.com/monaco-editor@0.52.2/min/vs/language/json/json.worker.js',
                'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/vs/language/json/json.worker.js'
              );
            case 'css':
            case 'scss':
            case 'less':
              return getWorkerModule(
                'https://unpkg.com/monaco-editor@0.52.2/min/vs/language/css/css.worker.js',
                'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/vs/language/css/css.worker.js'
              );
            case 'html':
            case 'handlebars':
            case 'razor':
              return getWorkerModule(
                'https://unpkg.com/monaco-editor@0.52.2/min/vs/language/html/html.worker.js',
                'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/vs/language/html/html.worker.js'
              );
            case 'typescript':
            case 'javascript':
              return getWorkerModule(
                'https://unpkg.com/monaco-editor@0.52.2/min/vs/language/typescript/ts.worker.js',
                'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/vs/language/typescript/ts.worker.js'
              );
            default:
              return getWorkerModule(
                'https://unpkg.com/monaco-editor@0.52.2/min/vs/base/worker/workerMain.js',
                'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/vs/base/worker/workerMain.js'
              );
          }
        }
      };
    }
    
    // Force relayout after short delay
    setTimeout(() => {
      if (editor) {
        editor.layout();
      }
    }, 100);
  };

  const handleEditorChange = (newValue) => {
    if (onChange && typeof onChange === 'function') {
      onChange(newValue);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (editorRef.current && isEditorReady) {
        // Add a small debounce to avoid excessive layout calls
        setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.layout();
          }
        }, 10);
      }
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isEditorReady]);

  // Handle editor loading errors
  const handleEditorValidation = (markers) => {
    // Handle validation markers if needed
    console.log('Editor validation markers:', markers);
  };

  return (
    <div style={{ height, width, position: 'relative' }}>
      <Editor
        height="100%"
        width="100%"
        theme="vs-dark"
        language={language}
        value={value}
        onMount={handleEditorDidMount}
        onChange={handleEditorChange}
        onValidate={handleEditorValidation}
        loading={<div>Loading editor...</div>}
        options={{
          fontSize: 16,
          minimap: { enabled: false },
          wordWrap: 'on',
          automaticLayout: false,
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: 'blink',
          cursorSmoothCaretAnimation: true,
          folding: true,
          lineNumbers: 'on',
          renderWhitespace: 'selection',
          contextmenu: true,
          mouseWheelZoom: false,
          quickSuggestions: {
            other: true,
            comments: false,
            strings: false
          },
          acceptSuggestionOnCommitCharacter: true,
          acceptSuggestionOnEnter: 'on',
          accessibilitySupport: 'auto'
        }}
      />
    </div>
  );
};

export default CodeEditor;