import { atom, useAtom } from 'jotai';
import { useEffect, useCallback } from 'react';
import { languagePreferenceStorage, defaultLanguage } from '@extension/storage';
import type { Language } from '@extension/storage';
import type { LocalesJSONType, I18nValueType } from './types.js';

// Atoms
const languageAtom = atom<Language>(defaultLanguage);
const messagesAtom = atom<LocalesJSONType | null>(null);

async function loadMessages(language: Language): Promise<LocalesJSONType> {
  // 修正: fetchで_localesから読み込む
  const res = await fetch(`/_locales/${language}/messages.json`);
  if (!res.ok) throw new Error('Failed to load messages');
  return await res.json();
}

// Hook for managing i18n
export function useI18n() {
  const [language, setLanguage] = useAtom(languageAtom);
  const [messages, setMessages] = useAtom(messagesAtom);

  // Load initial language and messages
  useEffect(() => {
    const init = async () => {
      const savedLanguage = await languagePreferenceStorage.get();
      setLanguage(savedLanguage);
      const loadedMessages = await loadMessages(savedLanguage);
      setMessages(loadedMessages);
    };
    init();
  }, [setLanguage, setMessages]);

  const setLanguageAndStorage = useCallback(
    async (newLanguage: Language) => {
      setLanguage(newLanguage);
      await languagePreferenceStorage.set(newLanguage);
      const loadedMessages = await loadMessages(newLanguage);
      setMessages(loadedMessages);
    },
    [setLanguage, setMessages],
  );

  const t = useCallback(
    (key: keyof LocalesJSONType, substitutions?: string | string[]) => {
      if (!messages) {
        return '';
      }
      const localeValues = messages[key] as I18nValueType;
      if (!localeValues) {
        return key;
      }

      let message = localeValues.message;

      if (localeValues.placeholders) {
        Object.entries(localeValues.placeholders).forEach(([placeholderKey, { content }]) => {
          if (content) {
            message = message.replace(new RegExp(`\\$${placeholderKey}\\$`, 'gi'), content);
          }
        });
      }

      if (!substitutions) {
        return message;
      } else if (Array.isArray(substitutions)) {
        return substitutions.reduce((acc, cur, idx) => acc.replace(`$${idx + 1}`, cur), message);
      }

      return message.replace(/\$1/, substitutions.toString());
    },
    [messages],
  );

  return { language, setLanguage: setLanguageAndStorage, t };
}

// A simple t function for non-component usage, though it won't be reactive.
// This is a limitation, and components should use the hook.
let staticMessages: LocalesJSONType | null = null;
languagePreferenceStorage.get().then((lang: Language) => {
  loadMessages(lang).then(messages => {
    staticMessages = messages;
  });
});

const translate = (
  messages: LocalesJSONType,
  key: keyof LocalesJSONType,
  substitutions?: string | string[],
): string => {
  const localeValues = messages[key] as I18nValueType;
  if (!localeValues) {
    return key;
  }

  let message = localeValues.message;

  if (localeValues.placeholders) {
    Object.entries(localeValues.placeholders).forEach(([placeholderKey, { content }]) => {
      if (content) {
        message = message.replace(new RegExp(`\\$${placeholderKey}\\$`, 'gi'), content);
      }
    });
  }

  if (!substitutions) {
    return message;
  } else if (Array.isArray(substitutions)) {
    return substitutions.reduce((acc, cur, idx) => acc.replace(`$${idx + 1}`, cur), message);
  }

  return message.replace(/\$1/, substitutions.toString());
};

export const t = (key: keyof LocalesJSONType, substitutions?: string | string[]): string => {
  if (!staticMessages) {
    // Fallback or loading state
    return '';
  }
  return translate(staticMessages, key, substitutions);
};
