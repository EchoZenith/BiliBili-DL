import axios from "axios";
const bvReg = /(BV|bv).{10}/i;
const avReg = /(av|AV)\d+/i;
const shareReg = /[a-zA-z]+:\/[^\s]*/;

async function getRedirectUrl(url) {
    return new Promise(async (resolve, reject) => {
        try {
            const response = await axios.get(url, { maxRedirects: 0 });
        } catch (e) {
            if(e.response && e.response.status === 302) {
                resolve(e.response.headers.location);
            } else { 
                reject(e);
            }
            
        }
    })
}

export { bvReg, avReg, shareReg, getRedirectUrl };