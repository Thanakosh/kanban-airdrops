/**
 * Configurações globais da aplicação AirdropBoard
 */
const CONFIG = {
    // Configurações de armazenamento
    STORAGE: {
        KEY: 'kanbanAirdrop',
        VERSION: '1.0.0',
        AUTO_SAVE_INTERVAL: 5000, // 5 segundos
    },

    // Configurações de interface
    UI: {
        ANIMATION_DURATION: 300,
        TOAST_DURATION: 3000,
        DEBOUNCE_DELAY: 300,
        MAX_COLUMNS: 10,
        MAX_CARDS_PER_COLUMN: 50,
    },

    // Configurações de tema
    THEME: {
        DEFAULT: 'dark',
        STORAGE_KEY: 'theme-preference',
    },

    // Configurações de idioma
    LANGUAGE: {
        DEFAULT: 'pt',
        STORAGE_KEY: 'language-preference',
        SUPPORTED: ['pt', 'en', 'es', 'zh'],
    },

    // Configurações de validação
    VALIDATION: {
        MAX_TITLE_LENGTH: 100,
        MAX_DESCRIPTION_LENGTH: 500,
        MAX_TAG_LENGTH: 20,
        MAX_TAGS_COUNT: 10,
    },

    // Configurações de exportação
    EXPORT: {
        FILENAME_PREFIX: 'airdropboard-backup',
        DATE_FORMAT: 'YYYY-MM-DD',
    },

    // URLs e APIs externas
    EXTERNAL: {
        FLAG_API: 'https://flagcdn.com/w20/',
        BOOTSTRAP_CDN: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
        FONTAWESOME_CDN: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css',
    },

    // Configurações de desenvolvimento
    DEBUG: {
        ENABLED: false,
        LOG_LEVEL: 'info', // 'debug', 'info', 'warn', 'error'
    },
};

// Função para obter configuração com fallback
function getConfig(path, defaultValue = null) {
    const keys = path.split('.');
    let current = CONFIG;
    
    for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
            current = current[key];
        } else {
            return defaultValue;
        }
    }
    
    return current;
}

// Função para logging condicional
function debugLog(level, message, ...args) {
    if (!getConfig('DEBUG.ENABLED')) return;
    
    const logLevel = getConfig('DEBUG.LOG_LEVEL', 'info');
    const levels = ['debug', 'info', 'warn', 'error'];
    
    if (levels.indexOf(level) >= levels.indexOf(logLevel)) {
        console[level](`[AirdropBoard] ${message}`, ...args);
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
    window.getConfig = getConfig;
    window.debugLog = debugLog;
}
