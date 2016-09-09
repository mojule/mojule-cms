'use strict'



const assert = require( 'assert' )
const objectToCsv = require( '../src/objecttocsv' )


const getSimpleObjA = () => {
  let result = {
    name: 'Andy Bell',
    email: 'andy.bell@informationage.co.nz',
    _id: 'c304aa954a458142d78ad3fffd7f9d64',
    personality: 'pillock',
    message: 'Look, here he is!.'
  }
  return result

}

const getSimpleObjB = () => {
  let result =
    {
      name: 'Nik Coughlin',
      email: 'nik.coughlin@informationage.co.nz',
      _id: '17421d377ec5402135bffc7117becf5f',
      personality: 'terrible pillock',
      message: 'I said, "there\'s the rub rodger".'
    }
  return result
}


const getSimpleObjs = () => {
  let result = [getSimpleObjA()]
  result.push( getSimpleObjB() )
  return result
}




describe( 'objectToCsv Tests', () => {
  it( 'should test invalid objects parameter values', () => {
    const csv1 = objectToCsv();
    assert( csv1, 'undefined' )

    const csv2 = objectToCsv(null);
    assert( csv2, 'null' )

    const csv3 = objectToCsv(1);
    assert( csv3, '1' )

    const csv4 = objectToCsv( {});
    assert.equal( csv4, '\n' )

    const csv5 = objectToCsv( {}, ['a','b'], true);
    assert.equal( csv5, '\n\n' )
  })
  it( 'should test valid objects parameter values', () => {
    const obj1 = getSimpleObjA()
    const csv1 = objectToCsv( obj1 )
    assert.equal( csv1, 'Andy Bell,andy.bell@informationage.co.nz,c304aa954a458142d78ad3fffd7f9d64,pillock,"Look, here he is!."\n' )

    const obj2 = getSimpleObjA()
    const csv2 = objectToCsv( obj2, ['_id', 'personality'] )
    assert.equal( csv2, 'Andy Bell,andy.bell@informationage.co.nz,"Look, here he is!."\n' )

    const obj3 = getSimpleObjB()
    const csv3 = objectToCsv( obj3, ['name', 'email', '_id', 'personality'] )
    assert.equal( csv3, '"I said, \'there\'s the rub rodger\'."\n' )

    const obj4 = getSimpleObjA()
    const csv4 = objectToCsv( obj4, [ 'email', '_id', 'personality', 'message'], true )
    assert.equal( csv4, 'name\nAndy Bell\n' )

    const obj5 = getSimpleObjs()
    const csv5 = objectToCsv( obj5, ['email', '_id', 'personality', 'message'], true )
    assert.equal( csv5, 'name\nAndy Bell\nNik Coughlin\n' )
  })



})