export const timeSince = (date) => {
  const seconds = Math.floor((new Date() - date) / 1000);

  let interval = seconds / 31536000;
  let calc;

  if (interval > 1) {
    // calc = Math.floor(interval)
    // return calc + (calc === 1 ? ' year' : ' years')
    return date.toLocaleDateString();
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    // calc = Math.floor(interval)
    // return calc + (calc === 1 ? ' month' : ' months')
    return date.toLocaleDateString();
  }
  interval = seconds / 86400;
  if (interval > 1) {
    // calc = Math.floor(interval)
    // return calc + (calc === 1 ? ' day' : ' days')
    return date.toLocaleDateString();
  }
  interval = seconds / 3600;
  if (interval > 1) {
    calc = Math.floor(interval);
    return calc + (calc === 1 ? " hour" : " hours");
  }
  interval = seconds / 60;
  if (interval > 1) {
    calc = Math.floor(interval);
    return calc + (calc === 1 ? " minute" : " minutes");
  }

  calc = Math.floor(interval);
  return calc + (calc === 1 ? " second" : " seconds");
};
export const bytesToSize = (bytes) => {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 Byte";
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i), 2) + " " + sizes[i];
};

export const encode = (key) => {
  return btoa(unescape(encodeURIComponent(key)))
}

export const decode = (key) => {
  return decodeURIComponent(escape(atob(key)))
}
