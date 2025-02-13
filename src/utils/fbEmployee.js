/**
 * Copyright 2019-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */

import util from 'util';
const exec = util.promisify(require('child_process').exec);

const cmd = 'klist --json';
const endWith = '@THEFACEBOOK.COM';

export function isFBEmployee(): Promise<boolean> {
  return exec(cmd).then(
    (stdobj: {stderr: string, stdout: string}) => {
      const principal = String(JSON.parse(stdobj.stdout).principal);

      return principal.endsWith(endWith);
    },
    err => {
      return false;
    },
  );
}
