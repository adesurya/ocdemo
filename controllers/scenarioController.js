const { Scenario } = require('../models/Scenario');
const { ScenarioShare } = require('../models/ScenarioShare');
const { User } = require('../models/User');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const viewHelpers = require('../utils/viewHelpers');

/**
 * Format file size dari bytes ke format yang dapat dibaca manusia
 * @param {Number} bytes - Ukuran file dalam bytes
 * @returns {String} - Format yang dapat dibaca manusia
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  

/**
 * Display the main scenario management page
 */
const index = async (req, res) => {
  try {


    // Get error/success messages from query params
    const errorMessage = req.query.error;
    const successMessage = req.query.success;
    
    // Get current folder ID from query parameter, default to root
    const currentFolderId = req.query.folder ? parseInt(req.query.folder) : null;
    
    // Get current folder data if we're in a subfolder
    let currentFolder = null;
    if (currentFolderId) {
      currentFolder = await Scenario.findByPk(currentFolderId, {
        include: [{ model: Scenario, as: 'parent' }]
      });
      
      // Check if folder exists
      if (!currentFolder) {
        return res.redirect('/scenarios?error=Folder tidak ditemukan');
      }
      
      // Check access permissions
      const hasAccess = await checkAccess(req.user.id, currentFolderId);
      if (!hasAccess) {
        return res.redirect('/scenarios?error=Anda tidak memiliki akses ke folder ini');
      }
    }
    
    // Get items in the current folder (files and subfolders)
    let whereClause = { 
      parentId: currentFolderId 
    };
    
    // For non-admin users, only show items they own or have been shared with them
    if (req.user.role !== 'admin') {
      // Get IDs of all scenarios shared with the user
      const sharedScenarioIds = await ScenarioShare.findAll({
        where: { userId: req.user.id },
        attributes: ['scenarioId']
      }).then(shares => shares.map(share => share.scenarioId));
      
      whereClause = {
        ...whereClause,
        [Op.or]: [
          { userId: req.user.id },
          { id: sharedScenarioIds }
        ]
      };
    }
    
    const items = await Scenario.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'owner', attributes: ['id', 'name', 'username'] }
      ],
      order: [
        ['isFolder', 'DESC'], // Folders first
        ['name', 'ASC']       // Then alphabetically
      ]
    });
    
    // Build breadcrumbs for navigation
    let breadcrumbs = [];
    if (currentFolder) {
      // Add the current folder
      breadcrumbs.push({ 
        id: currentFolder.id, 
        name: currentFolder.name 
      });
      
      // Add parents recursively
      let parent = currentFolder.parent;
      while (parent) {
        breadcrumbs.unshift({ 
          id: parent.id, 
          name: parent.name 
        });
        
        // Get the next parent
        parent = await Scenario.findOne({
          where: { id: parent.parentId },
          include: [{ model: Scenario, as: 'parent' }]
        });
      }
    }
    
    // Add "Home" as the first breadcrumb
    breadcrumbs.unshift({ id: null, name: 'Home' });
    
    res.render('scenarios/index', {
        title: 'Scenario Test Management',
        activeMenu: 'scenarios',
        breadcrumbs,
        currentFolder,
        items,
        error: errorMessage,
        success: successMessage,
        formatFileSize // Tambahkan ini
      });
  } catch (error) {
    console.error('Error loading scenarios:', error);
    res.redirect('/?error=Gagal memuat data scenario');
  }
};

/**
 * Show form to create a new folder
 */
const createFolder = async (req, res) => {
  try {
    const parentId = req.query.parent ? parseInt(req.query.parent) : null;
    const errorMessage = req.query.error;
    
    // If parent ID specified, check if it exists and user has access
    let parentFolder = null;
    if (parentId) {
      parentFolder = await Scenario.findByPk(parentId);
      
      if (!parentFolder) {
        return res.redirect('/scenarios?error=Parent folder tidak ditemukan');
      }
      
      // Check access permissions
      const hasAccess = await checkAccess(req.user.id, parentId);
      if (!hasAccess) {
        return res.redirect('/scenarios?error=Anda tidak memiliki akses ke folder ini');
      }
    }
    
    res.render('scenarios/create-folder', {
      title: 'Create New Folder',
      activeMenu: 'scenarios',
      parentFolder,
      parentId,
      error: errorMessage
    });
  } catch (error) {
    console.error('Error loading create folder form:', error);
    res.redirect('/scenarios?error=Gagal memuat form');
  }
};

/**
 * Store a new folder
 */
const storeFolder = async (req, res) => {
  try {
    const { name, description, parentId } = req.body;
    
    // Validate input
    if (!name) {
      return res.redirect(`/scenarios/create-folder${parentId ? `?parent=${parentId}&error=Folder name is required` : '?error=Folder name is required'}`);
    }
    
    // If parent ID specified, check if it exists and user has access
    if (parentId) {
      const parentFolder = await Scenario.findByPk(parentId);
      
      if (!parentFolder) {
        return res.redirect('/scenarios?error=Parent folder tidak ditemukan');
      }
      
      // Check access permissions
      const hasAccess = await checkAccess(req.user.id, parentId);
      if (!hasAccess) {
        return res.redirect('/scenarios?error=Anda tidak memiliki akses ke folder ini');
      }
    }
    
    // Create folder
    await Scenario.create({
      name,
      description,
      parentId: parentId || null,
      isFolder: true,
      userId: req.user.id
    });
    
    return res.redirect(`/scenarios${parentId ? `?folder=${parentId}&success=Folder berhasil dibuat` : '?success=Folder berhasil dibuat'}`);
  } catch (error) {
    console.error('Error creating folder:', error);
    return res.redirect('/scenarios?error=Gagal membuat folder');
  }
};

/**
 * Show form to upload a file
 */
const uploadFile = async (req, res) => {
  try {
    const parentId = req.query.parent ? parseInt(req.query.parent) : null;
    const errorMessage = req.query.error;
    
    // If parent ID specified, check if it exists and user has access
    let parentFolder = null;
    if (parentId) {
      parentFolder = await Scenario.findByPk(parentId);
      
      if (!parentFolder) {
        return res.redirect('/scenarios?error=Parent folder tidak ditemukan');
      }
      
      // Check access permissions
      const hasAccess = await checkAccess(req.user.id, parentId);
      if (!hasAccess) {
        return res.redirect('/scenarios?error=Anda tidak memiliki akses ke folder ini');
      }
    }
    
    res.render('scenarios/upload-file', {
      title: 'Upload File',
      activeMenu: 'scenarios',
      parentFolder,
      parentId,
      error: errorMessage
    });
  } catch (error) {
    console.error('Error loading upload file form:', error);
    res.redirect('/scenarios?error=Gagal memuat form');
  }
};

/**
 * Store an uploaded file
 */
const storeFile = async (req, res) => {
  try {
    const { name, description, parentId } = req.body;
    
    // Validate input
    if (!name) {
      return res.redirect(`/scenarios/upload-file${parentId ? `?parent=${parentId}&error=File name is required` : '?error=File name is required'}`);
    }
    
    if (!req.file) {
      return res.redirect(`/scenarios/upload-file${parentId ? `?parent=${parentId}&error=Please select a file to upload` : '?error=Please select a file to upload'}`);
    }
    
    // If parent ID specified, check if it exists and user has access
    if (parentId) {
      const parentFolder = await Scenario.findByPk(parentId);
      
      if (!parentFolder) {
        return res.redirect('/scenarios?error=Parent folder tidak ditemukan');
      }
      
      // Check access permissions
      const hasAccess = await checkAccess(req.user.id, parentId);
      if (!hasAccess) {
        return res.redirect('/scenarios?error=Anda tidak memiliki akses ke folder ini');
      }
    }
    
    // Create file record
    await Scenario.create({
      name,
      description,
      parentId: parentId || null,
      isFolder: false,
      userId: req.user.id,
      filePath: path.join('uploads/scenarios', path.basename(req.file.path)),
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      originalFilename: req.file.originalname
    });
    
    return res.redirect(`/scenarios${parentId ? `?folder=${parentId}&success=File berhasil diunggah` : '?success=File berhasil diunggah'}`);
  } catch (error) {
    console.error('Error uploading file:', error);
    return res.redirect('/scenarios?error=Gagal mengunggah file');
  }
};

/**
 * Download a file
 */
const downloadFile = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the file
    const file = await Scenario.findOne({
      where: {
        id,
        isFolder: false
      }
    });
    
    if (!file) {
      return res.redirect('/scenarios?error=File tidak ditemukan');
    }
    
    // Check access permissions
    const hasAccess = await checkAccess(req.user.id, id);
    if (!hasAccess) {
      return res.redirect('/scenarios?error=Anda tidak memiliki akses ke file ini');
    }
    
    // Check if file exists in the filesystem
    const filePath = path.join(__dirname, '..', file.filePath);
    if (!fs.existsSync(filePath)) {
      return res.redirect('/scenarios?error=File tidak ditemukan di server');
    }
    
    // Set filename for download
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalFilename}"`);
    
    // Stream file to response
    res.download(filePath, file.originalFilename);
  } catch (error) {
    console.error('Error downloading file:', error);
    return res.redirect('/scenarios?error=Gagal mengunduh file');
  }
};

/**
 * Delete a folder or file
 */
const destroy = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the item
    const item = await Scenario.findByPk(id);
    
    if (!item) {
      return res.redirect('/scenarios?error=Item tidak ditemukan');
    }
    
    // Only admin or owner can delete
    if (req.user.role !== 'admin' && item.userId !== req.user.id) {
      return res.redirect('/scenarios?error=Anda tidak memiliki izin untuk menghapus item ini');
    }
    
    // If it's a folder, check if it's empty
    if (item.isFolder) {
      const children = await Scenario.findAll({
        where: { parentId: id }
      });
      
      if (children.length > 0) {
        return res.redirect(`/scenarios?folder=${id}&error=Folder tidak kosong. Hapus semua item di dalamnya terlebih dahulu.`);
      }
    }
    // If it's a file, delete the actual file
    else if (item.filePath) {
      const filePath = path.join(__dirname, '..', item.filePath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    // Delete any shares associated with this item
    await ScenarioShare.destroy({
      where: { scenarioId: id }
    });
    
    // Delete the item from database
    await item.destroy();
    
    return res.redirect(`/scenarios${item.parentId ? `?folder=${item.parentId}&success=${item.isFolder ? 'Folder' : 'File'} berhasil dihapus` : `?success=${item.isFolder ? 'Folder' : 'File'} berhasil dihapus`}`);
  } catch (error) {
    console.error('Error deleting item:', error);
    return res.redirect('/scenarios?error=Gagal menghapus item');
  }
};

/**
 * Show share management page for an item
 */
const manageShares = async (req, res) => {
  try {
    const { id } = req.params;
    const errorMessage = req.query.error;
    const successMessage = req.query.success;
    
    // Find the item
    const item = await Scenario.findByPk(id, {
      include: [{ model: User, as: 'owner' }]
    });
    
    if (!item) {
      return res.redirect('/scenarios?error=Item tidak ditemukan');
    }
    
    // Only admin or owner can manage shares
    if (req.user.role !== 'admin' && item.userId !== req.user.id) {
      return res.redirect('/scenarios?error=Anda tidak memiliki izin untuk mengelola share');
    }
    
    // Get current shares
    const shares = await ScenarioShare.findAll({
      where: { scenarioId: id },
      include: [{ model: User }]
    });
    
    // Get list of users for sharing (exclude owner and already shared users)
    const sharedUserIds = [item.userId, ...shares.map(share => share.userId)];
    const availableUsers = await User.findAll({
      where: {
        id: { [Op.notIn]: sharedUserIds },
        status: 'active'
      }
    });
    
    res.render('scenarios/shares', {
      title: `Manage Shares - ${item.name}`,
      activeMenu: 'scenarios',
      item,
      shares,
      availableUsers,
      error: errorMessage,
      success: successMessage,
      formatFileSize: viewHelpers.formatFileSize // Add this line to pass the function
    });
  } catch (error) {
    console.error('Error loading share management:', error);
    res.redirect('/scenarios?error=Gagal memuat pengelolaan share');
  }
};

/**
 * Add a new share for an item
 */
const addShare = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, permissionLevel } = req.body;
    
    // Validate input
    if (!userId || !permissionLevel) {
      return res.redirect(`/scenarios/${id}/shares?error=User dan permission level harus dipilih`);
    }
    
    // Find the item
    const item = await Scenario.findByPk(id);
    
    if (!item) {
      return res.redirect('/scenarios?error=Item tidak ditemukan');
    }
    
    // Only admin or owner can add shares
    if (req.user.role !== 'admin' && item.userId !== req.user.id) {
      return res.redirect('/scenarios?error=Anda tidak memiliki izin untuk menambahkan share');
    }
    
    // Check if share already exists
    const existingShare = await ScenarioShare.findOne({
      where: {
        scenarioId: id,
        userId
      }
    });
    
    if (existingShare) {
      return res.redirect(`/scenarios/${id}/shares?error=User ini sudah memiliki akses ke item ini`);
    }
    
    // Create the share
    await ScenarioShare.create({
      scenarioId: id,
      userId,
      permissionLevel
    });
    
    return res.redirect(`/scenarios/${id}/shares?success=Share berhasil ditambahkan`);
  } catch (error) {
    console.error('Error adding share:', error);
    return res.redirect(`/scenarios/${id}/shares?error=Gagal menambahkan share`);
  }
};

/**
 * Remove a share
 */
const removeShare = async (req, res) => {
  try {
    const { id, shareId } = req.params;
    
    // Find the item
    const item = await Scenario.findByPk(id);
    
    if (!item) {
      return res.redirect('/scenarios?error=Item tidak ditemukan');
    }
    
    // Only admin or owner can remove shares
    if (req.user.role !== 'admin' && item.userId !== req.user.id) {
      return res.redirect('/scenarios?error=Anda tidak memiliki izin untuk menghapus share');
    }
    
    // Find and delete the share
    const share = await ScenarioShare.findOne({
      where: {
        id: shareId,
        scenarioId: id
      }
    });
    
    if (!share) {
      return res.redirect(`/scenarios/${id}/shares?error=Share tidak ditemukan`);
    }
    
    await share.destroy();
    
    return res.redirect(`/scenarios/${id}/shares?success=Share berhasil dihapus`);
  } catch (error) {
    console.error('Error removing share:', error);
    return res.redirect(`/scenarios/${id}/shares?error=Gagal menghapus share`);
  }
};

/**
 * Helper function to check if a user has access to a scenario item
 * @param {Number} userId User ID
 * @param {Number} scenarioId Scenario ID
 * @returns {Boolean} Whether the user has access
 */
async function checkAccess(userId, scenarioId) {
  // Find the scenario
  const scenario = await Scenario.findByPk(scenarioId);
  
  if (!scenario) {
    return false;
  }
  
  // User is the owner
  if (scenario.userId === userId) {
    return true;
  }
  
  // Check if there's a share for this user
  const share = await ScenarioShare.findOne({
    where: {
      scenarioId,
      userId
    }
  });
  
  if (share) {
    return true;
  }
  
  // If it has a parent, check access to the parent recursively
  if (scenario.parentId) {
    return await checkAccess(userId, scenario.parentId);
  }
  
  return false;
}

/**
 * Show form to rename a folder or file
 */
const showRenameForm = async (req, res) => {
    try {
      const { id } = req.params;
      const errorMessage = req.query.error;
      
      // Find the item
      const item = await Scenario.findByPk(id);
      
      if (!item) {
        return res.redirect('/scenarios?error=Item tidak ditemukan');
      }
      
      // Only admin or owner can rename
      if (req.user.role !== 'admin' && item.userId !== req.user.id) {
        return res.redirect('/scenarios?error=Anda tidak memiliki izin untuk mengubah item ini');
      }
      
      res.render('scenarios/rename', {
        title: `Rename ${item.isFolder ? 'Folder' : 'File'}`,
        activeMenu: 'scenarios',
        item,
        error: errorMessage
      });
    } catch (error) {
      console.error('Error loading rename form:', error);
      res.redirect('/scenarios?error=Gagal memuat form rename');
    }
  };
  
  /**
   * Process rename action
   */
  const renameItem = async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;
      
      // Validate input
      if (!name) {
        return res.redirect(`/scenarios/${id}/rename?error=Name is required`);
      }
      
      // Find the item
      const item = await Scenario.findByPk(id);
      
      if (!item) {
        return res.redirect('/scenarios?error=Item tidak ditemukan');
      }
      
      // Only admin or owner can rename
      if (req.user.role !== 'admin' && item.userId !== req.user.id) {
        return res.redirect('/scenarios?error=Anda tidak memiliki izin untuk mengubah item ini');
      }
      
      // Update item
      await item.update({
        name,
        description
      });
      
      return res.redirect(`/scenarios${item.parentId ? `?folder=${item.parentId}&success=Item berhasil diubah` : '?success=Item berhasil diubah'}`);
    } catch (error) {
      console.error('Error renaming item:', error);
      return res.redirect(`/scenarios/${req.params.id}/rename?error=Gagal mengubah item`);
    }
  };

  module.exports = {
    index,
    createFolder,
    storeFolder,
    uploadFile,
    storeFile,
    downloadFile,
    destroy,
    showRenameForm,
    renameItem,
    manageShares,
    addShare,
    removeShare
  };