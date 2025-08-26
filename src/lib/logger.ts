// Sistema de logs detalhado para debugging
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
  data?: unknown;
  error?: Error;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private createLogEntry(
    level: LogLevel,
    component: string,
    message: string,
    data?: unknown,
    error?: Error
  ): LogEntry {
    return {
      timestamp: this.formatTimestamp(),
      level,
      component,
      message,
      data,
      error
    };
  }

  private addLog(entry: LogEntry) {
    this.logs.push(entry);
    
    // Manter apenas os últimos logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log no console também
    const consoleMessage = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.component}] ${entry.message}`;
    
    switch (entry.level) {
      case 'debug':
        console.debug(consoleMessage, entry.data);
        break;
      case 'info':
        console.info(consoleMessage, entry.data);
        break;
      case 'warn':
        console.warn(consoleMessage, entry.data);
        break;
      case 'error':
        console.error(consoleMessage, entry.data, entry.error);
        break;
    }
  }

  debug(component: string, message: string, data?: unknown) {
    this.addLog(this.createLogEntry('debug', component, message, data));
  }

  info(component: string, message: string, data?: unknown) {
    this.addLog(this.createLogEntry('info', component, message, data));
  }

  warn(component: string, message: string, data?: unknown) {
    this.addLog(this.createLogEntry('warn', component, message, data));
  }

  error(component: string, message: string, error?: Error, data?: unknown) {
    this.addLog(this.createLogEntry('error', component, message, data, error));
  }

  // Métodos específicos para autenticação
  authDebug(message: string, data?: unknown) {
    this.debug('AUTH', message, data);
  }

  authInfo(message: string, data?: unknown) {
    this.info('AUTH', message, data);
  }

  authWarn(message: string, data?: unknown) {
    this.warn('AUTH', message, data);
  }

  authError(message: string, error?: Error, data?: unknown) {
    this.error('AUTH', message, error, data);
  }

  // Métodos específicos para Supabase
  supabaseDebug(message: string, data?: unknown) {
    this.debug('SUPABASE', message, data);
  }

  supabaseInfo(message: string, data?: unknown) {
    this.info('SUPABASE', message, data);
  }

  supabaseWarn(message: string, data?: unknown) {
    this.warn('SUPABASE', message, data);
  }

  supabaseError(message: string, error?: Error, data?: unknown) {
    this.error('SUPABASE', message, error, data);
  }

  // Obter logs filtrados
  getLogs(level?: LogLevel, component?: string): LogEntry[] {
    return this.logs.filter(log => {
      if (level && log.level !== level) return false;
      if (component && log.component !== component) return false;
      return true;
    });
  }

  // Obter logs como string formatada
  getLogsAsString(level?: LogLevel, component?: string): string {
    const filteredLogs = this.getLogs(level, component);
    return filteredLogs.map(log => {
      let logStr = `[${log.timestamp}] [${log.level.toUpperCase()}] [${log.component}] ${log.message}`;
      if (log.data) {
        logStr += `\nData: ${JSON.stringify(log.data, null, 2)}`;
      }
      if (log.error) {
        logStr += `\nError: ${log.error.message}\nStack: ${log.error.stack}`;
      }
      return logStr;
    }).join('\n\n');
  }

  // Limpar logs
  clearLogs() {
    this.logs = [];
    console.clear();
  }

  // Exportar logs para download
  exportLogs(): string {
    const exportData = {
      timestamp: this.formatTimestamp(),
      totalLogs: this.logs.length,
      logs: this.logs
    };
    return JSON.stringify(exportData, null, 2);
  }
}

// Instância global do logger
export const logger = new Logger();

// Hook para React components
export function useLogger() {
  return logger;
}

// Função para download de logs
export function downloadLogs() {
  const logsData = logger.exportLogs();
  const blob = new Blob([logsData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cooper-pro-logs-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Inicializar logging
logger.info('SYSTEM', 'Logger inicializado');

export default logger;