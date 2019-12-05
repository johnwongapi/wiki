const Model = require('objection').Model

/* global WIKI */

const pathTreeRegex = /^(.*?)\//g;

/**
 * PageTree model
 */
module.exports = class PageTree extends Model {
  static get tableName() { return 'pageTree' }

  static get jsonSchema () {
    return {
      type: 'object',
      required: ['path', 'title', 'depth'],

      properties: {
        id: {type: 'integer'},
        path: {type: 'string'},
        depth: {type: 'integer'},
        title: {type: 'string'},
        isFolder: {type: 'boolean'},
        privateNS: {type: 'string'},
        parent: {type: 'integer'}
      }
    }
  }

  static get relationMappings() {
    return {
      pageId: {
        relation: Model.BelongsToOneRelation,
        modelClass: require('./pages'),
        join: {
          from: 'pageTree.pageId',
          to: 'pages.id'
        }
      },
      locale: {
        relation: Model.BelongsToOneRelation,
        modelClass: require('./locales'),
        join: {
          from: 'pageTree.localeCode',
          to: 'locales.code'
        }
      }
    }
  }

  $beforeUpdate() {
    this.updatedAt = new Date().toISOString()
  }
  $beforeInsert() {
    this.createdAt = new Date().toISOString()
    this.updatedAt = new Date().toISOString()
  }

  /**
   * Fetch an Existing PageTree from Cache if possible
   *
   * @param {Object} opts PageTree Properties
   * @returns {Promise} Promise of the PageTree Model Instance
   */
  static async getPageTree(opts) {
      // -> Get from DB
    return await WIKI.models.pageTree.getPageTreeFromDb(opts)
  }

  /**
   * Fetch an Existing PageTree from the Database
   *
   * @param {Object} opts PageTree Properties
   * @returns {Promise} Promise of the PageTree Model Instance
   */
  static async getPageTreeFromDb(opts) {
    const path = opts.path;
    let rootPath = pathTreeRegex.exec(path);
    if (rootPath) {
      rootPath = rootPath[1];
    } else {
      rootPath = path;
    }
    WIKI.logger.info(`querying ${rootPath}, ${path}, ${pathTreeRegex.exec(path)}`);
    try {
      return WIKI.models.pageTree.query()
        .column([
          'pageTree.id',
          'pageTree.path',
          'pageTree.depth',
          'pageTree.title',
          'pageTree.isPrivate',
          'pageTree.isFolder',
          'pageTree.privateNS',
          'pageTree.parent',
          'pageTree.pageId',
          'pageTree.localeCode'
        ])
        .where('pageTree.path', 'like', `${rootPath}/%`)
        .orWhere('pageTree.path', rootPath)
        .orderBy('pageTree.path', 'asc')
    } catch (err) {
      WIKI.logger.warn(err);
      throw err
    }
  }



}
