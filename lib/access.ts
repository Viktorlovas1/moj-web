export const ACCESS_COOKIE_NAME = "bu_access";
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;
const encoder = new TextEncoder();
function bytesToHex(bytes: Uint8Array) { return Array.from(bytes,(byte)=>byte.toString(16).padStart(2,"0")).join(""); }
async function sha256(value:string){const digest=await crypto.subtle.digest("SHA-256",encoder.encode(value));return new Uint8Array(digest);}
async function hmac(value:string,secret:string){const key=await crypto.subtle.importKey("raw",encoder.encode(secret),{hash:"SHA-256",name:"HMAC"},false,["sign"]);const signature=await crypto.subtle.sign("HMAC",key,encoder.encode(value));return bytesToHex(new Uint8Array(signature));}
function constantTimeEqual(left:string,right:string){if(left.length!==right.length)return false;let mismatch=0;for(let i=0;i<left.length;i+=1)mismatch|=left.charCodeAt(i)^right.charCodeAt(i);return mismatch===0;}
export function isAccessConfigured(){return Boolean(process.env.ACCESS_CODE&&process.env.ACCESS_COOKIE_SECRET);}
export async function verifyAccessCode(code:string){const expectedCode=process.env.ACCESS_CODE;if(!expectedCode)return false;const [providedHash,expectedHash]=await Promise.all([sha256(code),sha256(expectedCode)]);return constantTimeEqual(bytesToHex(providedHash),bytesToHex(expectedHash));}
export async function createAccessCookie(){const secret=process.env.ACCESS_COOKIE_SECRET;if(!secret)throw new Error("Access cookie secret is not configured");const expiresAt=Math.floor(Date.now()/1000)+TOKEN_TTL_SECONDS;const payload=String(expiresAt);return `${payload}.${await hmac(payload,secret)}`;}
export async function isAccessCookieValid(value?:string){const secret=process.env.ACCESS_COOKIE_SECRET;if(!secret||!value)return false;const [expiresAtRaw,signature,...extra]=value.split(".");const expiresAt=Number(expiresAtRaw);if(extra.length>0||!expiresAtRaw||!signature||!Number.isFinite(expiresAt)||expiresAt<=Math.floor(Date.now()/1000))return false;const expectedSignature=await hmac(expiresAtRaw,secret);return constantTimeEqual(signature,expectedSignature);}
export const accessCookieMaxAge=TOKEN_TTL_SECONDS;
