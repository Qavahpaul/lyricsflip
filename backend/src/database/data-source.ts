import { DataSource } from 'typeorm';

/** DataSource used by the TypeORM CLI (`npm run migration:run`). */
export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [__dirname + '/../**/*.entity.{ts,js}'],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
});
