// Fork migration — fertilizer risk-communication experiment.
//
// Adds the new arm + treatment columns and relaxes the NOT-NULL on
// round2_version so fork sessions (no Round 2 version) can be inserted.
//
// Legacy seeds-and-insurance rows (if any) keep their round2_version values;
// new fork rows write NULL for round2_version and populate arm_* columns.

exports.up = (pgm) => {
  // Drop the NOT-NULL — fork payloads do not carry round2Version.
  pgm.alterColumn('sessions', 'round2_version', { notNull: false });

  // New fork-specific columns. arm_id is the dash-joined cell, e.g.
  // 'distribution-train'. Kept as plain text to avoid downstream churn
  // if a new display format is ever added.
  pgm.addColumns('sessions', {
    arm_id: { type: 'text' },
    arm_display: { type: 'text' },
    arm_training: { type: 'boolean' },
    treatment_group: { type: 'text' },
  });

  pgm.createIndex('sessions', 'arm_id');
  pgm.createIndex('sessions', 'treatment_group');
};

exports.down = (pgm) => {
  pgm.dropIndex('sessions', 'treatment_group');
  pgm.dropIndex('sessions', 'arm_id');
  pgm.dropColumns('sessions', ['arm_id', 'arm_display', 'arm_training', 'treatment_group']);
  // Cannot safely restore NOT-NULL without knowing values for new rows.
};
