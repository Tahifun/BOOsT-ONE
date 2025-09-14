import { Router } from 'express';

const router = Router();

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Login (Beispiel)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: JWT ausgestellt
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token: { type: string }
 */
router.post('/auth/login', (req, res) => {
  // Demo-Response
  return res.json({ token: 'demo.jwt.token' });
});

export default router;
