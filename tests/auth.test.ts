import { test } from 'node:test';
import assert from 'node:assert/strict';
import {scryptSync} from 'node:crypto';
import {passwordMatches,createSession,validSession} from '../lib/auth';
test('Administración: contraseña y firma de sesión rechazan valores adulterados',()=>{
 const salt='sal-prueba';const hash=`${salt}:${scryptSync('contraseña de prueba',salt,64).toString('hex')}`;
 assert.equal(passwordMatches('contraseña de prueba',hash),true);
 assert.equal(passwordMatches('otra',hash),false);
 assert.equal(passwordMatches('prueba','invalid'),false);
 process.env.ADMIN_SESSION_SECRET='secreto de pruebas que supera treinta y dos caracteres';
 const token=createSession();assert.equal(validSession(token),true);assert.equal(validSession(token+'x'),false);assert.equal(validSession(undefined),false);assert.equal(validSession(token+'.extra'),false);
});
