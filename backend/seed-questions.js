/**
 * seed-questions.js
 * 
 * Reads JSON files from the /questions folder and inserts them
 * directly into the database — no upload endpoint needed.
 *
 * Usage:
 *   node seed-questions.js
 *   node seed-questions.js --dry-run   (preview without inserting)
 *   node seed-questions.js --clear     (delete existing questions first)
 */

require('dotenv').config();
const path  = require('path');
const fs    = require('fs');
const { query, pool } = require('./config/database');

const DRY_RUN = process.argv.includes('--dry-run');
const CLEAR   = process.argv.includes('--clear');

// Map JSON topic names → subjects.name in the database
const SUBJECT_MAP = {
  'Chemistry':             'Chemistry',
  'Economics':             'Economics',
  'Literature in English': 'Literature in English',
  'Mathematics':           'Mathematics',
  'Physics':               'Physics',
  'Accounting':            'Accounting',
  'Biology':               'Biology',
  'Commerce':              'Commerce',
};

// Folder that contains the JSON files (relative to this script)
const JSON_DIR = path.join(__dirname, 'questions');

async function run() {
  try {
    console.log('\n🌱  JAMB Question Seeder');
    console.log('─'.repeat(40));
    if (DRY_RUN) console.log('⚠️  DRY RUN — nothing will be written\n');

    // ── 1. Load subject IDs from the database ────────────────
    const subjectRows = await query('SELECT id, name FROM subjects WHERE is_active = true');
    const subjectIdMap = {};
    for (const row of subjectRows.rows) {
      subjectIdMap[row.name] = row.id;
    }
    console.log(`✅ Found ${subjectRows.rows.length} subjects in DB`);

    // ── 2. Optionally clear existing questions ────────────────
    if (CLEAR && !DRY_RUN) {
      await query("UPDATE questions SET is_active = false");
      console.log('🗑️  Cleared existing questions (soft delete)');
    }

    // ── 3. Find JSON files ────────────────────────────────────
    if (!fs.existsSync(JSON_DIR)) {
      console.error(`\n❌  Folder not found: ${JSON_DIR}`);
      console.error('   Create a "questions" folder in your backend directory');
      console.error('   and put your JSON files there.\n');
      process.exit(1);
    }

    const files = fs.readdirSync(JSON_DIR).filter(f => f.endsWith('.json'));
    if (files.length === 0) {
      console.error('\n❌  No JSON files found in', JSON_DIR);
      process.exit(1);
    }
    console.log(`📂 Found ${files.length} JSON file(s): ${files.join(', ')}\n`);

    // ── 4. Process each file ──────────────────────────────────
    let grandTotal = 0;
    let grandInserted = 0;
    let grandSkipped = 0;
    let grandErrors = 0;

    for (const file of files) {
      const filePath = path.join(JSON_DIR, file);
      let questions;

      try {
        questions = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (e) {
        console.error(`❌ ${file}: invalid JSON — ${e.message}`);
        continue;
      }

      if (!Array.isArray(questions)) {
        console.error(`❌ ${file}: must be a JSON array`);
        continue;
      }

      console.log(`📄 ${file} — ${questions.length} questions`);

      let inserted = 0, skipped = 0, errors = 0;

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];

        // Resolve subject_id
        const topicName = q.topic || q.subject;
        const subjectName = SUBJECT_MAP[topicName] || topicName;
        const subject_id  = subjectIdMap[subjectName];

        if (!subject_id) {
          console.warn(`   ⚠️  Row ${i + 1}: unknown subject "${topicName}" — skipping`);
          skipped++;
          continue;
        }

        // Validate required fields
        const required = ['question_text','option_a','option_b','option_c','option_d','correct_answer'];
        const missing  = required.filter(f => !q[f]);
        if (missing.length > 0) {
          console.warn(`   ⚠️  Row ${i + 1}: missing ${missing.join(', ')} — skipping`);
          skipped++;
          continue;
        }

        const answer = String(q.correct_answer).toUpperCase();
        if (!['A','B','C','D'].includes(answer)) {
          console.warn(`   ⚠️  Row ${i + 1}: invalid correct_answer "${q.correct_answer}" — skipping`);
          skipped++;
          continue;
        }

        if (DRY_RUN) { inserted++; continue; }

        try {
          await query(
            `INSERT INTO questions
               (subject_id, question_text, option_a, option_b, option_c, option_d,
                correct_answer, explanation, year, difficulty, topic, source)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'seed')
             ON CONFLICT DO NOTHING`,
            [
              subject_id,
              q.question_text.trim(),
              q.option_a, q.option_b, q.option_c, q.option_d,
              answer,
              q.explanation  || null,
              q.year         || null,
              q.difficulty   || 'medium',
              q.topic        || subjectName,
            ]
          );
          inserted++;
        } catch (err) {
          console.error(`   ❌ Row ${i + 1}: ${err.message}`);
          errors++;
        }
      }

      const status = DRY_RUN ? '(dry run)' : '';
      console.log(`   ✅ ${inserted} inserted  ⚠️  ${skipped} skipped  ❌ ${errors} errors ${status}`);
      grandTotal    += questions.length;
      grandInserted += inserted;
      grandSkipped  += skipped;
      grandErrors   += errors;
    }

    // ── 5. Summary ────────────────────────────────────────────
    console.log('\n' + '─'.repeat(40));
    console.log(`📊 Total processed : ${grandTotal}`);
    console.log(`✅ Inserted        : ${grandInserted}`);
    console.log(`⚠️  Skipped         : ${grandSkipped}`);
    console.log(`❌ Errors          : ${grandErrors}`);
    if (DRY_RUN) console.log('\n⚠️  DRY RUN — re-run without --dry-run to actually insert');
    console.log('');

  } catch (err) {
    console.error('\n❌ Fatal error:', err.message);
    console.error(err.stack);
  } finally {
    await pool.end();
  }
}

run();
