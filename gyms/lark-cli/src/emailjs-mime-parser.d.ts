declare module 'emailjs-mime-parser' {
  const parser: { default: (text: string) => any } | ((text: string) => any);
  export default parser;
}
