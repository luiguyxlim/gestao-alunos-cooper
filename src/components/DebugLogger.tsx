'use client'

import { useState, useEffect } from 'react'
import { logger, downloadLogs } from '@/lib/logger'

interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  component: string;
  message: string;
  data?: unknown;
  error?: Error;
}

export default function DebugLogger() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      const allLogs = logger.getLogs();
      setLogs(allLogs);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    if (filter === 'auth') return log.component === 'AUTH';
    if (filter === 'supabase') return log.component === 'SUPABASE';
    if (filter === 'error') return log.level === 'error';
    return log.level === filter;
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'debug': return 'text-gray-600';
      case 'info': return 'text-blue-600';
      case 'warn': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getLevelBg = (level: string) => {
    switch (level) {
      case 'debug': return 'bg-gray-100';
      case 'info': return 'bg-blue-100';
      case 'warn': return 'bg-yellow-100';
      case 'error': return 'bg-red-100';
      default: return 'bg-gray-100';
    }
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-gray-700 transition-colors"
        >
          🐛 Debug Logs
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-96 bg-white border border-gray-300 rounded-lg shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 text-white px-4 py-2 rounded-t-lg flex justify-between items-center">
        <h3 className="font-semibold">Debug Logger</h3>
        <div className="flex gap-2">
          <button
            onClick={downloadLogs}
            className="text-xs bg-blue-600 px-2 py-1 rounded hover:bg-blue-700"
            title="Download logs"
          >
            📥
          </button>
          <button
            onClick={() => logger.clearLogs()}
            className="text-xs bg-red-600 px-2 py-1 rounded hover:bg-red-700"
            title="Limpar logs"
          >
            🗑️
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="text-xs bg-gray-600 px-2 py-1 rounded hover:bg-gray-700"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="p-2 border-b border-gray-200 flex gap-2 items-center text-xs">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1 text-xs"
        >
          <option value="all">Todos</option>
          <option value="auth">Auth</option>
          <option value="supabase">Supabase</option>
          <option value="error">Erros</option>
          <option value="warn">Avisos</option>
          <option value="info">Info</option>
          <option value="debug">Debug</option>
        </select>
        
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
            className="w-3 h-3"
          />
          Auto-scroll
        </label>
        
        <span className="text-gray-500">({filteredLogs.length} logs)</span>
      </div>

      {/* Logs */}
      <div className="flex-1 overflow-y-auto p-2 text-xs font-mono">
        {filteredLogs.length === 0 ? (
          <div className="text-gray-500 text-center py-4">Nenhum log encontrado</div>
        ) : (
          filteredLogs.map((log, index) => (
            <div
              key={index}
              className={`mb-2 p-2 rounded border-l-4 ${getLevelBg(log.level)} border-l-${log.level === 'error' ? 'red' : log.level === 'warn' ? 'yellow' : log.level === 'info' ? 'blue' : 'gray'}-500`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={`font-semibold ${getLevelColor(log.level)}`}>
                  [{log.level.toUpperCase()}] {log.component}
                </span>
                <span className="text-gray-400 text-xs">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
              
              <div className="text-gray-800 mb-1">{log.message}</div>
              
              {log.data !== undefined && log.data !== null && (
                <details className="text-gray-600">
                  <summary className="cursor-pointer text-blue-600 hover:text-blue-800">Dados</summary>
                  <pre className="mt-1 text-xs bg-gray-50 p-1 rounded overflow-x-auto">
                    {typeof log.data === 'string' ? log.data : JSON.stringify(log.data, null, 2)}
                  </pre>
                </details>
              )}
              
              {log.error && (
                <details className="text-red-600">
                  <summary className="cursor-pointer text-red-600 hover:text-red-800">Erro</summary>
                  <pre className="mt-1 text-xs bg-red-50 p-1 rounded overflow-x-auto">
                    {log.error.message}\n{log.error.stack}
                  </pre>
                </details>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}