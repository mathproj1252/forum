// database.js

// Инициализация Supabase
const supabaseUrl = 'https://icinmrmefhqavemeeexz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljaW5tcm1lZmhxYXZlbWVlZXh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNTM1MTEsImV4cCI6MjA3NTgyOTUxMX0.Boza1RmPpeKEiDBLj48Wh5aEzSCikwSSbITOgDc78mU';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// Класс для работы с Supabase
class SupabaseDatabase {
    constructor() {
        this.client = supabaseClient;
    }

    async init() {
        return Promise.resolve();
    }

    // Пользователи
    async addUser(userData) {
        const { data, error } = await this.client
            .from('users')
            .insert([userData])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    async getUser(userId) {
        const { data, error } = await this.client
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (error) return null;
        return data;
    }

    async getUserByEmail(email) {
        const { data, error } = await this.client
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
        
        if (error) return null;
        return data;
    }

    async getAllUsers() {
        const { data, error } = await this.client
            .from('users')
            .select('*');
        
        if (error) return [];
        return data;
    }

    async updateUser(userId, userData) {
        const { data, error } = await this.client
            .from('users')
            .update(userData)
            .eq('id', userId)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    async deleteUser(userId) {
        const { error } = await this.client
            .from('users')
            .delete()
            .eq('id', userId);
        
        if (error) throw error;
    }

    // Задачи
    async addProblem(problemData) {
        const { data, error } = await this.client
            .from('problems')
            .insert([problemData])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    async getProblem(problemId) {
        const { data, error } = await this.client
            .from('problems')
            .select(`
                *,
                solutions (*),
                comments (*)
            `)
            .eq('id', problemId)
            .single();
        
        if (error) {
            console.error('Ошибка при получении задачи:', error);
            return null;
        }
        
        // Добавляем совместимость со старым кодом
        if (data) {
            data.authorId = data.author_id;
            data.bestSolutionId = data.best_solution_id;
            if (!data.solutions) data.solutions = [];
            if (!data.comments) data.comments = [];
            if (!data.likes) data.likes = [];
            if (!data.dislikes) data.dislikes = [];
            if (!data.favorites) data.favorites = [];
            if (!data.images) data.images = [];
            // Добавляем вычисляемое поле date
            data.date = data.created_at ? new Date(data.created_at).toLocaleDateString('ru-RU') : 'Неизвестно';
            
            // Добавляем даты для решений и комментариев
            data.solutions.forEach(solution => {
                solution.date = solution.created_at ? new Date(solution.created_at).toLocaleDateString('ru-RU') : 'Неизвестно';
            });
            
            data.comments.forEach(comment => {
                comment.date = comment.created_at ? new Date(comment.created_at).toLocaleDateString('ru-RU') : 'Неизвестно';
            });
        }
        
        return data;
    }

    async getAllProblems() {
        const { data, error } = await this.client
            .from('problems')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Ошибка при получении задач:', error);
            return [];
        }
        
        // Добавляем совместимость
        data.forEach(problem => {
            problem.authorId = problem.author_id;
            problem.bestSolutionId = problem.best_solution_id;
            if (!problem.solutions) problem.solutions = [];
            if (!problem.comments) problem.comments = [];
            if (!problem.likes) problem.likes = [];
            if (!problem.dislikes) problem.dislikes = [];
            if (!problem.favorites) problem.favorites = [];
            if (!problem.images) problem.images = [];
            // Добавляем вычисляемое поле date
            problem.date = problem.created_at ? new Date(problem.created_at).toLocaleDateString('ru-RU') : 'Неизвестно';
        });
        
        return data;
    }

    async updateProblem(problemId, problemData) {
        // Преобразуем названия полей для соответствия БД
        const dbProblemData = { ...problemData };
        
        // Если есть поля с camelCase, преобразуем их в snake_case
        if (dbProblemData.bestSolutionId !== undefined) {
            dbProblemData.best_solution_id = dbProblemData.bestSolutionId;
            delete dbProblemData.bestSolutionId;
        }
        
        if (dbProblemData.authorId !== undefined) {
            dbProblemData.author_id = dbProblemData.authorId;
            delete dbProblemData.authorId;
        }
        
        const { data, error } = await this.client
            .from('problems')
            .update(dbProblemData)
            .eq('id', problemId)
            .select()
            .single();
        
        if (error) {
            console.error('Ошибка при обновлении задачи:', error);
            throw error;
        }
        
        // Возвращаем с совместимыми полями
        if (data) {
            data.authorId = data.author_id;
            data.bestSolutionId = data.best_solution_id;
            if (!data.solutions) data.solutions = [];
            if (!data.comments) data.comments = [];
        }
        
        return data;
    }

    async deleteProblem(problemId) {
        // Сначала удаляем связанные решения и комментарии
        await this.client.from('solutions').delete().eq('problem_id', problemId);
        await this.client.from('comments').delete().eq('problem_id', problemId);
        
        // Затем удаляем задачу
        const { error } = await this.client
            .from('problems')
            .delete()
            .eq('id', problemId);
        
        if (error) throw error;
    }

    // Решения
    async addSolution(solutionData) {
        const { data, error } = await this.client
            .from('solutions')
            .insert([solutionData])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    async getSolution(solutionId) {
        const { data, error } = await this.client
            .from('solutions')
            .select('*')
            .eq('id', solutionId)
            .single();
        
        if (error) return null;
        return data;
    }

    async updateSolution(solutionId, solutionData) {
        const { data, error } = await this.client
            .from('solutions')
            .update(solutionData)
            .eq('id', solutionId)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    async deleteSolution(solutionId) {
        const { error } = await this.client
            .from('solutions')
            .delete()
            .eq('id', solutionId);
        
        if (error) throw error;
    }

    // Комментарии
    async addComment(commentData) {
        const { data, error } = await this.client
            .from('comments')
            .insert([commentData])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    async getComment(commentId) {
        const { data, error } = await this.client
            .from('comments')
            .select('*')
            .eq('id', commentId)
            .single();
        
        if (error) return null;
        return data;
    }

    async updateComment(commentId, commentData) {
        const { data, error } = await this.client
            .from('comments')
            .update(commentData)
            .eq('id', commentId)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    async deleteComment(commentId) {
        const { error } = await this.client
            .from('comments')
            .delete()
            .eq('id', commentId);
        
        if (error) throw error;
    }

    // Поиск
    async searchProblems(searchTerm) {
        const { data, error } = await this.client
            .from('problems')
            .select('*')
            .or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%,author.ilike.%${searchTerm}%`)
            .order('created_at', { ascending: false });
        
        if (error) return [];
        return data;
    }
}