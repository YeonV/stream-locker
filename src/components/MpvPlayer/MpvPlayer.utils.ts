  export const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return [
      h > 0 ? h : null,
      m,
      s < 10 ? `0${s}` : s,
    ].filter(v => v !== null).join(':');
  };