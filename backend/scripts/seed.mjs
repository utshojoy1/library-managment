import { randomBytes, scryptSync } from 'node:crypto'
import pg from 'pg'

const connectionString =
  process.env.DATABASE_URL ?? 'postgres://library:library@127.0.0.1:5434/library'

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `scrypt:${salt}:${hash}`
}

const USERS = [
  ['Super Admin', 'superadmin@library.local', 'Super12345', 'super_admin'],
  ['Library Admin', 'admin@library.local', 'Admin12345', 'admin'],
  ['Demo Member', 'member@library.local', 'Member12345', 'member'],
]

const BOOKS = [
  ['The Pragmatic Programmer', 'Andrew Hunt & David Thomas', '978-0201616224', 'Technology', 1999, 3],
  ['Clean Code', 'Robert C. Martin', '978-0132350884', 'Technology', 2008, 2],
  ['Sapiens', 'Yuval Noah Harari', '978-0062316097', 'History', 2011, 3],
  ['The Great Gatsby', 'F. Scott Fitzgerald', '978-0743273565', 'Fiction', 1925, 2],
  ['A Brief History of Time', 'Stephen Hawking', '978-0553380163', 'Science', 1988, 2],
  ['Educated', 'Tara Westover', '978-0399590504', 'Biography', 2018, 2],
  ['Norwegian Wood', 'Haruki Murakami', '978-0375704024', 'Fiction', 1987, 2],
  ['Thinking, Fast and Slow', 'Daniel Kahneman', '978-0374533557', 'Psychology', 2011, 3],
]

// [member_no, name, email, phone, user_email|null]
const MEMBERS = [
  ['M001', 'Amelia Hart', 'amelia@example.com', '+880 1711 000111', null],
  ['M002', 'Daniel Okafor', 'daniel@example.com', '+880 1711 000222', null],
  ['M003', 'Sofia Reyes', 'sofia@example.com', '+880 1711 000333', null],
  ['M004', 'Marcus Chen', 'marcus@example.com', '+880 1711 000444', null],
  ['M005', 'Demo Member', 'member@library.local', '+880 1711 000555', 'member@library.local'],
]

const client = new pg.Client({ connectionString })

try {
  await client.connect()
  await client.query(
    'truncate loans, copies, books, members, sessions, email_tokens, emails, users restart identity cascade',
  )

  const userIds = {}
  for (const [name, email, password, role] of USERS) {
    const { rows } = await client.query(
      'insert into users (name, email, password_hash, role, email_verified_at) values ($1, $2, $3, $4, now()) returning id',
      [name, email, hashPassword(password), role],
    )
    userIds[email] = rows[0].id
  }

  for (const [memberNo, name, email, phone, userEmail] of MEMBERS) {
    await client.query(
      'insert into members (member_no, name, email, phone, user_id) values ($1, $2, $3, $4, $5)',
      [memberNo, name, email, phone, userEmail ? userIds[userEmail] : null],
    )
  }

  for (const [title, author, isbn, category, year, count] of BOOKS) {
    const { rows } = await client.query(
      `insert into books (title, author, isbn, category, published_year)
       values ($1, $2, $3, $4, $5) returning id`,
      [title, author, isbn, category, year],
    )
    const bookId = rows[0].id
    for (let i = 1; i <= count; i += 1) {
      const barcode = `B${String(bookId).padStart(4, '0')}-${i}`
      await client.query('insert into copies (book_id, barcode) values ($1, $2)', [bookId, barcode])
    }
  }

  const loans = [
    // barcode, member_no, issued_at, due_at, returned_at
    ['B0001-1', 'M001', "now() - interval '2 days'", "now() + interval '12 days'", null],
    ['B0003-2', 'M002', "now() - interval '5 days'", "now() + interval '9 days'", null],
    ['B0004-1', 'M003', "now() - interval '17 days'", "now() - interval '3 days'", null],
    ['B0002-1', 'M005', "now() - interval '4 days'", "now() + interval '10 days'", null],
    ['B0005-1', 'M001', "now() - interval '45 days'", "now() - interval '31 days'", "now() - interval '29 days'"],
  ]

  for (const [barcode, memberNo, issued, due, returned] of loans) {
    const { rows } = await client.query(
      `insert into loans (copy_id, member_id, issued_at, due_at, returned_at, status)
       select c.id, m.id, ${issued}, ${due}, ${returned}, ${
         returned ? "'returned'" : "'active'"
       }
       from copies c, members m
       where c.barcode = $1 and m.member_no = $2
       returning id`,
      [barcode, memberNo],
    )
    if (!returned) {
      await client.query("update copies set status = 'on_loan' where barcode = $1", [barcode])
    }
    if (!rows.length) console.warn('seed: loan skipped for', barcode, memberNo)
  }

  const { rows: counts } = await client.query(
    `select
       (select count(*) from books) as books,
       (select count(*) from copies) as copies,
       (select count(*) from members) as members,
       (select count(*) from users) as users,
       (select count(*) from loans) as loans`,
  )
  console.log('Seeded:', counts[0])
  console.log('Sign in: superadmin@library.local / Super12345')
  console.log('         admin@library.local / Admin12345')
  console.log('         member@library.local / Member12345')
} catch (error) {
  console.error('Seed failed:', error.message)
  process.exitCode = 1
} finally {
  await client.end()
}
