'use strict'

const url = require( 'url' )
const cheerio = require( 'cheerio' )
const request = require( 'request' )
const path = require( 'path' )
const utils = require( '../utils/utils' )
const ViewModel = require( '../form-models/form-view-model' )
const FormModel = require( '../view-models/form-model' )
const RegisterModel = require( '../view-models/register-model' )
const Reference = require( '../form-models/reference' )
const DbItem = require( '../db/db-item' )
const UserApi = require( './user-api' )
const PageApi = require( './page-api' )
const Configurator = require( '../configurator' )
const configurator = Configurator( path.join( process.cwd(), 'configuration.json' ) )

const newForm = ( site, store, model, user ) => {
  const form = Object.assign({
    key: 'form',
    creator: user._id,
    values: {},
    children: []
  }, model )

  return store.saveP( form )
}

const createEmailForm = ( api, site, store, user, body ) =>
  store.getP( 'form' )
    .then(
      forms => {
        const names = forms.map( f => f.name )

        const dynamicSchema = {
          name: {
            not: {
              enum: names
            }
          }
        }

        const formModel = FormModel( dynamicSchema )

        const form = formModel.assemble( body )

        const validate = formModel.validate( form )

        if( validate.errors.length > 0 ){
          const formForm = formModel.form( {}, form, validate.errors )

          return Promise.resolve({
            valid: false,
            data: formForm
          })
        } else {
          return api.newForm( user, form )
            .then(
              form => Promise.resolve({
                valid: true,
                data: form
              })
            )
        }
      }
    )


const createRegisterForm = ( api, site, store, user, body ) => {
  let forms
  let pages

  return store.getP( 'form' )
    .then(
      allForms => {
        forms = allForms
      }
    )
    .then(
      () => store.getP( 'page' )
    )
    .then(
      allPages => {
        pages = allPages
      }
    )
    .then(
      () => {
        const siteClaims = Array.isArray( site.claims ) ? site.claims : []
        const names = forms.map( f => f.name )
        const pageRefs = pages.map( Reference )

        const editorClaims = siteClaims.map( claim => {
          return {
            name: claim,
            _id: utils.toIdentifier( claim )
          }
        })

        const dynamicSchema = {
          name: {
            not: {
              enum: names
            }
          },
          claims: {
            items: {
              enum: editorClaims
            }
          },
          loginPage: {
            enum: pageRefs
          },
          registerPage: {
            enum: pageRefs
          }
        }

        const formModel = RegisterModel( dynamicSchema )

        const form = formModel.assemble( body )

        const validate = formModel.validate( form )

        if( validate.errors.length > 0 ){
          const formForm = formModel.form( {}, form, validate.errors )

          return Promise.resolve({
            valid: false,
            data: formForm
          })
        } else {
          //add components to form.children, make them undeletable
          form.children = [
            {
              _id: utils.randomId( 'formText' ),
              key: 'formText',
              values: {
                html: 'Name',
                required: true,
                default: '',
                preventDelete: true
              }
            },
            {
              _id: utils.randomId( 'formEmail' ),
              key: 'formEmail',
              values: {
                html: 'Email',
                required: true,
                default: '',
                preventDelete: true
              }
            }
          ]

          return api.newForm( user, form )
            .then(
              form => Promise.resolve({
                valid: true,
                data: form
              })
            )
        }
      }
    )
}


const create = ( api, site, store, user, body ) => {
  if( body[ 'register.formType' ] === 'register' ){
    return createRegisterForm( api, site, store, user, body )
  }

  return createEmailForm( api, site, store, user, body )
}

const editEmail = ( api, site, store, form, body ) => {
  return store.getP( 'form' )
    .then(
      forms => {
        const id = form._id

        const names = forms.filter(
          f => f._id !== id
        ).map(
          f => f.name
        )

        const dynamicSchema = {
          name: {
            not: {
              enum: names
            }
          }
        }

        const formModel = FormModel( dynamicSchema )

        const newForm = formModel.assemble( body )

        const validate = formModel.validate( newForm )

        if( validate.errors.length > 0 ){
          const formOptions = {
            action: '/cms/forms/' + id
          }

          const formForm = formModel.form( formOptions, newForm, validate.errors )

          return Promise.resolve({
            valid: false,
            data: formForm
          })
        } else {
          return Promise.resolve({
            valid: true,
            data: Object.assign( {}, form, newForm )
          })
        }
      }
    )
    .then(
      result => {
        if( result.valid ){
          return store.saveP( result.data )
            .then(
              () => result
            )
        } else {
          return Promise.resolve( result )
        }
      }
    )
}


const editRegister = ( api, site, store, form, body ) => {
  let pages
  let forms

  return store.getP( 'form' )
    .then(
      allForms => {
        forms = allForms
      }
    )
    .then(
      () => store.getP( 'page' )
    )
    .then(
      allPages => {
        pages = allPages
      }
    )
    .then(
      () => {
        const siteClaims = Array.isArray( site.claims ) ? site.claims : []
        const id = form._id

        const names = forms.filter(
          f => f._id !== id
        ).map(
          f => f.name
        )

        const loginRefs = pages.map(
          p => {
            const ref = Reference( p )

            ref.selected = p._id === form.loginPage

            return ref
          }
        )

        const registerRefs = pages.map(
          p => {
            const ref = Reference( p )

            ref.selected = p._id === form.registerPage

            return ref
          }
        )

        const editorClaims = siteClaims.map( claim => {
          return {
            name: claim,
            _id: utils.toIdentifier( claim )
          }
        })

        const dynamicSchema = {
          name: {
            not: {
              enum: names
            }
          },
          claims: {
            items: {
              enum: editorClaims
            }
          },
          loginPage: {
            enum: loginRefs
          },
          registerPage: {
            enum: registerRefs
          }
        }

        const formModel = RegisterModel( dynamicSchema )

        const newForm = formModel.assemble( body )

        const validate = formModel.validate( newForm )

        if( validate.errors.length > 0 ){
          const formOptions = {
            action: '/cms/forms/' + id
          }

          const formForm = formModel.form( formOptions, newForm, validate.errors )

          return Promise.resolve({
            valid: false,
            data: formForm
          })
        } else {
          return Promise.resolve({
            valid: true,
            data: Object.assign( {}, form, newForm )
          })
        }
      }
    )
    .then(
      result => {
        if( result.valid ){
          return store.saveP( result.data )
            .then(
              () => result
            )
        } else {
          return Promise.resolve( result )
        }
      }
    )
}

const edit = ( api, site, store, form, body ) => {
  if( form.formType === 'register' ){
    return editRegister( api, site, store, form, body )
  }

  //default fallback type, as older forms were all email forms and don't have a formType property
  return editEmail( api, site, store, form, body )
}

const schemaProperty = node => {
  const $ = cheerio.load( '<div>' + node.values.html + '</div>' )

  const title = $( 'div' ).text()

  const key = utils.toIdentifier( title )

  const property = {
    key,
    value: {
      title
    }
  }

  if( node.values.default || node.values.default === false ){
    property.value.default = node.values.default
  }

  return property
}

const booleanProperty = node => {
  const property = schemaProperty(node)

  property.value.type = 'boolean'

  return property
}

const textProperty = node => {
  const property = schemaProperty(node)

  property.value.type = 'string'

  if( node.values.required ){
    property.value.minLength = 1
  }

  return property
}

const emailProperty = node => {
  const property = textProperty(node)

  property.value.format = 'email'

  return property
}

const multilineProperty = node => {
  const property = textProperty( node )

  property.value.format = 'textarea'

  return property
}

const checkboxProperty = node => {
  const property = booleanProperty( node )

  property.value.format = 'checkbox'

  return property
}

const dropdownProperty = node => {
  const property = schemaProperty( node )

  property.value.type = 'string'
  property.value.format = 'selectlist'

  property.value.enum = node.values.items

  return property
}

const toSchema = form => {
  const schema = {
    "title": form.name,
    "id": form._id,
    "type": "object",
    "properties": {
    },
    "required": []
  }

  form.children.forEach( child => {
    let property

    if (child.key === 'formEmail') {
      property = emailProperty(child)
    } else if (child.key === 'formMultiline') {
      property = multilineProperty(child)
    } else if (child.key === 'formCheckbox') {
      property = checkboxProperty( child )
    } else if (child.key === 'formDropdown') {
      property = dropdownProperty( child )
    } else {
      property = textProperty( child )
    }

    schema.properties[ property.key ] = property.value

    if( child.values.required ){
      schema.required.push( property.key )
    }
  })

  return schema
}

//note the last parens, ordinarily you pass it a dynamic schema to extend the built in one
//we don't need it here (atm)
const viewModel = form =>
  ViewModel( toSchema( form ) )()

const sendEmail = ( emailer, email ) => new Promise(
  ( resolve, reject ) => {
    emailer.send( email, ( err, json ) => {
      if( err ){
        reject( err )
      } else {
        resolve( json )
      }
    })
  }
)

const toKeyValues = ( form, postedForm ) => {
  const schema = toSchema( form )

  const kv = []

  Object.keys( schema.properties ).forEach(
    key => {
      kv.push({
        key: schema.properties[ key ].title,
        value: postedForm[ key ]
      })
    }
  )

  return kv
}

const verifyCaptcha = ( response, remoteip ) => new Promise(
  ( resolve, reject ) => {
    const url = 'https://www.google.com/recaptcha/api/siteverify'
    const secret = configurator.recaptcha().secretkey
    const formData = { secret, response, remoteip }

    const options = { url, formData }

    request.post( options, ( err, httpResponse, body ) => {
      if( err ){
        reject( err )
      } else {
        resolve( JSON.parse( body ) )
      }
    })
  }
)

const verifyIfCaptcha = ( isCaptcha, response, remoteip ) => {
  if( !isCaptcha ){
    return Promise.resolve({ success: true })
  }

  return verifyCaptcha( response, remoteip )
}

const actionEmail = ( api, site, store, form, body, ip ) => {
  const formModel = viewModel( form )

  const postedForm = formModel.assemble( body )

  const validate = formModel.validate( postedForm )

  if( validate.errors.length > 0 ){
    return Promise.resolve({
      valid: false,
      data: {
        errors: validate.errors,
        body: postedForm,
        returnId: body.returnId
      }
    })
  } else {
    const emailer = require( '../email' )

    const formPost = DbItem({
      formId: form._id,
      post: postedForm
    }, 'formPost' )

    const kv = toKeyValues( form, postedForm )

    return verifyIfCaptcha( form.useCaptcha, body[ 'g-recaptcha-response' ], ip )
      .then(
        result => {
          if( !result.success ) throw Error( result[ 'error-codes' ].join( ', ') )
        }
      )
      .then(
        () => store.saveP( formPost )
      )
      .then(
        () => {
          const to = form.email
          const from = postedForm.email || 'noreply@mojule.co'
          const subject = postedForm.subject || [ site.name, form.name, 'Form' ].join( ' ' )

          const text = kv.reduce(
            ( emailBody, pair ) => {
              return emailBody + pair.key + ':\n' + pair.value + '\n\n'
            },
            form.name + '\n\n'
          )

          const html = kv.reduce(
            ( emailBody, pair ) => {
              return emailBody + '<strong>' + pair.key + ':</strong><br /><pre>' + pair.value + '</pre><br /><br />'
            },
            '<div style="font-family:sans-serif"><h1>' + form.name + '</h1>'
          ) + '</div>'

          const email = new emailer.Email({ to, from, subject, text, html })

          return sendEmail( emailer, email )
        }
      )
      .then(
        () => Promise.resolve({
          valid: true,
          data: {
            returnId: body.returnId
          }
        })
      )
  }
}

const actionRegister = ( api, site, store, form, body, ip, session ) => {
  const pageApi = PageApi( site, store, session )

  const formModel = viewModel( form )

  const postedForm = formModel.assemble( body )

  const validate = formModel.validate( postedForm )

  let page
  let route

  if( validate.errors.length > 0 ){
    return Promise.resolve({
      valid: false,
      data: {
        errors: validate.errors,
        body: postedForm,
        returnId: body.returnId
      }
    })
  } else {
    return verifyIfCaptcha( form.useCaptcha, body[ 'g-recaptcha-response' ], ip )
      .then(
        result => {
          if( !result.success ) throw Error( result[ 'error-codes' ].join( ', ') )
        }
      )
      .then(
        () => store.loadP( form.loginPage._id )
      )
      .then(
        loginPage => {
          page = loginPage
        }
      )
      .then(
        () => pageApi.getRoute( page )
      )
      .then(
        loginRoute => {
          route = loginRoute
        }
      )
      .then(
        () => {
          const emailer = require( '../email' )
          const userApi = UserApi( store, emailer )

          //more like a mock user, is contructed from the form's creator
          const creator = { _id: form.creator }

          const userBody = {
            'user.name': postedForm.name,
            'user.email': postedForm.email,
            'user.claims': form.claims.map( claim => claim._id ),
            'user.sites': [ site._id ]
          }

          const urlData = url.parse( site.urls[ 0 ] )

          const loginUrl = url.format({
            protocol: urlData.protocol,
            hostname: urlData.hostname,
            pathname: route
          })

          return userApi.create( creator, userBody, site.claims, site, postedForm, loginUrl )
        }
      )
      .then(
        () => Promise.resolve({
          valid: true,
          data: {
            returnId: body.returnId
          }
        })
      )
  }
}

const action = ( api, site, store, form, body, ip, session ) => {
  if( form.formType === 'register' ){
    return actionRegister( api, site, store, form, body, ip, session )
  }

  return actionEmail( api, site, store, form, body, ip )
}

const FormApi = ( site, store, session ) => {
  const api = {
    create: ( user, body ) => create( api, site, store, user, body ),
    edit: ( form, body ) => edit( api, site, store, form, body ),
    newForm: ( user, form ) => newForm( site, store, form, user ),
    viewModel: form => viewModel( form ),
    action: ( form, body, ip ) => action( api, site, store, form, body, ip, session )
  }

  return api
}

module.exports = FormApi
