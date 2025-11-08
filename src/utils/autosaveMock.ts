export async function autosaveSnapshot(sessionId: string, data: object) {
  const content = JSON.stringify(data, null, 2);
  console.info(`[autosave] session=${sessionId} size=${content.length}B`);
  await new Promise((resolve) => setTimeout(resolve, 800));
  localStorage.setItem(`filon-${sessionId}-snapshot`, content);
  return { ok: true, timestamp: Date.now() };
}

