/*
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-1, as defined
 * in FIPS PUB 180-1
 * Version 2.1a Copyright Paul Johnston 2000 - 2002.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for details.
 */

/*
 * Configurable variables. You may need to tweak these to be compatible with
 * the server-side, but the defaults work in most cases.
 */
var hexcase = 0;  /* hex output format. 0 - lowercase; 1 - uppercase        */
var b64pad  = ""; /* base-64 pad character. "=" for strict RFC compliance   */
var chrsz   = 8;  /* bits per input character. 8 - ASCII; 16 - Unicode      */

/*
 * These are the functions you'll usually want to call
 * They take string arguments and return either hex or base-64 encoded strings
 */
function hex_sha1(s) {
    "use strict";
    return binb2hex(core_sha1(str2binb(s),s.length * chrsz));
}
function b64_sha1(s) {
    "use strict";
    return binb2b64(core_sha1(str2binb(s),s.length * chrsz));
}
function str_sha1(s) {
    "use strict";
    return binb2str(core_sha1(str2binb(s),s.length * chrsz));
}
function hex_hmac_sha1(key, data) {
    "use strict";
    return binb2hex(core_hmac_sha1(key, data));
}
function b64_hmac_sha1(key, data) {
    "use strict";
    return binb2b64(core_hmac_sha1(key, data));
}
function str_hmac_sha1(key, data){
    "use strict";
    return binb2str(core_hmac_sha1(key, data));
}

/*
 * Perform a simple self-test to see if the VM is working
 */
function sha1_vm_test() {
    "use strict";
    return hex_sha1("abc") == "a9993e364706816aba3e25717850c26c9cd0d89d";
}

/*
 * Calculate the SHA-1 of an array of big-endian words, and a bit length
 */
function core_sha1(x, len) {
    "use strict";
    /* append padding */
    /* SC - Get rid of warning */
    var i = (len >> 5);
    if (x[i] == undefined) {
      x[i]  = 0x80 << (24 - len % 32);
    }
    else {
      x[i] |= 0x80 << (24 - len % 32);
    }
    /*x[len >> 5] |= 0x80 << (24 - len % 32);*/
    x[((len + 64 >> 9) << 4) + 15] = len;

    var w = Array(80);
    var a =  1732584193;
    var b = -271733879;
    var c = -1732584194;
    var d =  271733878;
    var e = -1009589776;
    var t;
    var j;
    var olda;
    var oldb;
    var oldc;
    var oldd;
    var olde;

    for(i = 0; i < x.length; i += 16)
    {
        olda = a;
        oldb = b;
        oldc = c;
        oldd = d;
        olde = e;

        for(j = 0; j < 80; j += 1) {
            if(j < 16) {
                w[j] = x[i + j];
            }
            else {
                w[j] = rol(w[j-3] ^ w[j-8] ^ w[j-14] ^ w[j-16], 1);
            }
            t = safe_add(safe_add(rol(a, 5), sha1_ft(j, b, c, d)),
                           safe_add(safe_add(e, w[j]), sha1_kt(j)));
            e = d;
            d = c;
            c = rol(b, 30);
            b = a;
            a = t;
        }

        a = safe_add(a, olda);
        b = safe_add(b, oldb);
        c = safe_add(c, oldc);
        d = safe_add(d, oldd);
        e = safe_add(e, olde);
    }
    return Array(a, b, c, d, e);

}

/*
 * Perform the appropriate triplet combination function for the current
 * iteration
 */
function sha1_ft(t, b, c, d) {
    "use strict";
    if(t < 20) {
        return (b & c) | ((~b) & d);
    }
    if(t < 40) {
        return b ^ c ^ d;
    }
    if(t < 60) {
        return (b & c) | (b & d) | (c & d);
    }
    return b ^ c ^ d;
}

/*
 * Determine the appropriate additive constant for the current iteration
 */
function sha1_kt(t) {
    "use strict";
    return (t < 20)
        ?  1518500249
        : (t < 40)
            ? 1859775393
            :(t < 60)
                ? -1894007588
                : -899497514;
}

/*
 * Calculate the HMAC-SHA1 of a key and some data
 */
function core_hmac_sha1(key, data) {
    "use strict";
    var bkey = str2binb(key);
    if(bkey.length > 16) {
        bkey = core_sha1(bkey, key.length * chrsz);
    }

    var ipad = Array(16);
    var opad = Array(16);
    var i;
    var k;
    for(i = 0; i < 16; i += 1) {
        /* SC - Get rid of warning */
        k = (bkey[i] != undefined ? bkey[i] : 0);
        ipad[i] = k ^ 0x36363636;
        opad[i] = k ^ 0x5C5C5C5C;
        /*  ipad[i] = bkey[i] ^ 0x36363636;
        opad[i] = bkey[i] ^ 0x5C5C5C5C;*/
    }

    var hash = core_sha1(ipad.concat(str2binb(data)), 512 + data.length * chrsz);
    return core_sha1(opad.concat(hash), 512 + 160);
}

/*
 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
 * to work around bugs in some JS interpreters.
 */
function safe_add(x, y) {
    "use strict";
    var lsw = (x & 0xFFFF) + (y & 0xFFFF);
    var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xFFFF);
}

/*
 * Bitwise rotate a 32-bit number to the left.
 */
function rol(num, cnt) {
    "use strict";
    return (num << cnt) | (num >>> (32 - cnt));
}

/*
 * Convert an 8-bit or 16-bit string to an array of big-endian words
 * In 8-bit function, characters >255 have their hi-byte silently ignored.
 */
function str2binb(str) {
    "use strict";
    var bin = Array();
    var mask = (1 << chrsz) - 1;
    var i;
    /* SC - Get rid of warnings */
    for(i = 0; i < str.length * chrsz; i += chrsz) {
        if (bin[i>>5] != undefined) {
            bin[i>>5] |= (str.charCodeAt(i / chrsz) & mask) << (32 - chrsz - i%32);
        } else {
            bin[i>>5]  = (str.charCodeAt(i / chrsz) & mask) << (32 - chrsz - i%32);
        }
    }
    /*for(var i = 0; i < str.length * chrsz; i += chrsz)
        bin[i>>5] |= (str.charCodeAt(i / chrsz) & mask) << (32 - chrsz - i%32);*/
    return bin;
}

/*
 * Convert an array of big-endian words to a string
 */
function binb2str(bin) {
    "use strict";
    var str = "";
    mask = (1 << chrsz) - 1;
    for(i = 0; i < bin.length * 32; i += chrsz) {
        str += String.fromCharCode((bin[i>>5] >>> (32 - chrsz - i%32)) & mask);
    }
    return str;
}

/*
 * Convert an array of big-endian words to a hex string.
 */
function binb2hex(binarray) {
    "use strict";
    var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
    var str = "";
    for(i = 0; i < binarray.length * 4; i += 1) {
        str += hex_tab.charAt((binarray[i>>2] >> ((3 - i%4)*8+4)) & 0xF) +
               hex_tab.charAt((binarray[i>>2] >> ((3 - i%4)*8  )) & 0xF);
    }
    return str;
}

/*
 * Convert an array of big-endian words to a base-64 string
 */
function binb2b64(binarray) {
    "use strict";
    var tab = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    var str = "";
    var b1;
    var b2;
    var b3;
    var triplet;
    var i;
    var j;
    for(i = 0; i < binarray.length * 4; i += 3) {
        /* SC - Get rid of warning */
        b1 = binarray[i >> 2] != undefined ? ((binarray[i   >> 2] >> 8 * (3 -  i   %4)) & 0xFF) << 16 : 0;
        b2 = binarray[i + 1 >> 2] != undefined ? ((binarray[i + 1 >> 2] >> 8 * (3 - (i + 1)%4)) & 0xFF) << 8  : 0;
        b3 = binarray[i + 2 >> 2] != undefined ? ((binarray[i + 2 >> 2] >> 8 * (3 - (i + 2)%4)) & 0xFF)       : 0;
        triplet = b1 | b2 | b3;
        /*var triplet = (((binarray[i   >> 2] >> 8 * (3 -  i   %4)) & 0xFF) << 16)
                    | (((binarray[i+1 >> 2] >> 8 * (3 - (i+1)%4)) & 0xFF) << 8 )
                    |  ((binarray[i+2 >> 2] >> 8 * (3 - (i+2)%4)) & 0xFF);*/
        for(j = 0; j < 4; j += 1) {
            if(i * 8 + j * 6 > binarray.length * 32) {
                str += b64pad;
            } else {
                str += tab.charAt((triplet >> 6 * (3 - j)) & 0x3F);
            }
        }
    }
    return str;
}
