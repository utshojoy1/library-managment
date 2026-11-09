// Shared by the Nest app (TypeOrmModule) and the TypeORM CLI (`-d dist/database/data-source.js`).
import 'reflect-metadata'
import '../env.js'
import { join } from 'node:path'
import { DataSource, type DataSourceOptions } from 'typeorm'

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL ?? 'postgres://library:library@127.0.0.1:5434/library',
  poolSize: 5,
  entities: [join(import.meta.dirname, '../**/*.entity.js')],
  migrations: [join(import.meta.dirname, 'migrations/*.js')],
  // The schema only changes through migrations, never by syncing entities.
  synchronize: false,
}

export default new DataSource(dataSourceOptions)
